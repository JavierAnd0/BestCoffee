"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  CUP_BASE_Y,
  SAUCER_H,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
  MOKA_FUNNEL_RIM,
  MOKA_SCALE,
  MOKA_YAW,
  POUR_TARGET,
  POUR_TILT,
} from "./constants";
import {
  createMokaBoilerGeometry,
  createMokaFunnelGeometry,
  createMokaHandleGeometry,
  createMokaLidGeometry,
  createMokaSpoutGeometry,
  createMokaUpperGeometry,
} from "./geometries";
import { lerp, mulberry32, smoothstep } from "./math";
import { liquidLevel, pourActive, pourState, setPourAmount, setPourImpact } from "./pour";
import { Steam } from "./steam";
import { makeNoiseTexture } from "./textures";

type P = { progress: MotionValue<number> };

const RINGS = 22;
const SIDES = 8;

/** Moka de aluminio: se arma por piezas, hierve y se inclina para servir en la taza. */
export function MokaStation({ progress }: P) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const mound = useRef<THREE.Mesh>(null);
  const spout = useRef<THREE.Object3D>(null);
  const stream = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(
    () => ({
      boiler: createMokaBoilerGeometry(),
      funnel: createMokaFunnelGeometry(),
      upper: createMokaUpperGeometry(),
      lid: createMokaLidGeometry(),
      handle: createMokaHandleGeometry(),
      spout: createMokaSpoutGeometry(),
    }),
    [],
  );
  // Aluminio: caras planas (como la moka real) + microtextura de rugosidad para que no parezca papel.
  const metal = useMemo(() => {
    const noise = makeNoiseTexture(256, 17);
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    noise.repeat.set(5, 3);
    return new THREE.MeshStandardMaterial({
      color: "#d3d7dd",
      metalness: 0.82,
      roughness: 0.45,
      roughnessMap: noise,
      bumpMap: noise,
      bumpScale: 0.25,
      envMapIntensity: 1.5,
      flatShading: true,
      side: THREE.DoubleSide,
    });
  }, []);
  const bakelite = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#161111", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    [],
  );
  const coffee = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b1509", roughness: 0.95 }), []);
  const liquid = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1c0b04", roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    [],
  );
  const dummyObj = useMemo(() => new THREE.Object3D(), []);
  const dropSeeds = useMemo(() => {
    const rnd = mulberry32(88);
    return Array.from({ length: 12 }, () => ({ phase: rnd(), a: rnd() * 6.28, r: 0.1 + rnd() * 0.22, h: 0.12 + rnd() * 0.2 }));
  }, []);
  // Cinta del chorro: RINGS anillos de SIDES vértices; se reposiciona en cada fotograma.
  const streamGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((RINGS + 1) * SIDES * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < RINGS; i++) {
      for (let j = 0; j < SIDES; j++) {
        const a = i * SIDES + j;
        const b = i * SIDES + ((j + 1) % SIDES);
        const c = (i + 1) * SIDES + j;
        const d = (i + 1) * SIDES + ((j + 1) % SIDES);
        idx.push(a, c, b, b, c, d);
      }
    }
    g.setIndex(idx);
    return g;
  }, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const base = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const r = root.current;
    const tl = tilt.current;
    const up = upper.current;
    if (!r || !tl || !up || !spout.current) return;
    const p = progress.get();
    const t = clock.elapsedTime;

    // Ya sirvió: sale de cuadro y deja de dibujarse.
    // Solo existe mientras le toca: no asoma por debajo antes de su estación.
    r.visible = p > 0.34 && p < 0.975;

    // 1) Dosificación → armada: la caldera baja a su estación.
    base.set(0, lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p)), 0);

    // 2) Servir: se inclina y su pico se coloca justo sobre la taza.
    const pourIn = smoothstep(0.72, 0.8, p);
    const pour = pourIn * (1 - smoothstep(0.9, 0.94, p));
    tl.rotation.z = -POUR_TILT * pour;
    r.rotation.set(0, MOKA_YAW, 0);
    r.position.copy(base);
    const brewing = smoothstep(0.58, 0.64, p) * (1 - pourIn);
    r.position.x += Math.sin(t * 38) * 0.004 * brewing;

    r.updateMatrixWorld(true);
    spout.current.getWorldPosition(tmp);
    const offX = tmp.x - r.position.x;
    const offY = tmp.y - r.position.y;
    const offZ = tmp.z - r.position.z;
    r.position.set(
      lerp(base.x, POUR_TARGET.x - offX, pour),
      lerp(base.y, POUR_TARGET.y - offY, pour),
      lerp(base.z, POUR_TARGET.z - offZ, pour),
    );
    r.updateMatrixWorld(true);

    // 3) La cámara superior llega desde un costado y se asienta sobre la caldera.
    const e = smoothstep(0.48, 0.6, p);
    up.visible = p > 0.455;
    up.position.set(lerp(2.2, 0, e), lerp(1.7, 0.95, e) + Math.sin(e * Math.PI) * 0.45, 0);
    up.rotation.z = (1 - e) * -0.5;

    // 4) El café molido va llenando el filtro mientras muele.
    if (mound.current) {
      const dose = smoothstep(0.26, 0.46, p);
      mound.current.scale.set(1, Math.max(dose, 0.001), 1);
      mound.current.visible = dose > 0.01;
    }

    // 5) Chorro: parábola desde la punta del pico hasta la superficie del café.
    spout.current.getWorldPosition(tmp);
    const surface = CUP_BASE_Y + SAUCER_H + liquidLevel(p);
    const amt = pourActive(p);
    setPourAmount(amt);
    const mesh = stream.current;
    if (mesh) {
      mesh.visible = amt > 0.02 && tmp.y - surface > 0.05;
      if (mesh.visible) {
        const G = 7;
        const H = tmp.y - surface;
        const T = Math.sqrt((2 * H) / G);
        const vh = 0.9 * amt; // velocidad horizontal: el chorro sale del pico con un arco
        const sg = mesh.geometry;
        const pos = sg.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i <= RINGS; i++) {
          const sN = i / RINGS;
          const tt = sN * T;
          const cx = tmp.x;
          const cy = tmp.y - 0.5 * G * tt * tt;
          const cz = tmp.z + vh * tt;
          // más grueso en el pico, se afina al acelerar; ondula hacia abajo
          const wobble = 1 + 0.1 * Math.sin(sN * 16 - t * 14);
          const r = Math.max(0.012, 0.052 * (1 - 0.5 * sN) * Math.sqrt(amt)) * wobble;
          for (let j = 0; j < SIDES; j++) {
            const a = (j / SIDES) * Math.PI * 2;
            pos.setXYZ(i * SIDES + j, cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r);
          }
        }
        pos.needsUpdate = true;
        sg.computeVertexNormals();
        sg.computeBoundingSphere();
        setPourImpact(tmp.x, surface, tmp.z + vh * T);
      }
    }
    // Gotas que saltan al caer el chorro
    const dr = drops.current;
    if (dr) {
      dr.visible = amt > 0.05;
      if (dr.visible) {
        dropSeeds.forEach((d, i) => {
          const life = (t * 1.7 + d.phase) % 1;
          const arc = 4 * life * (1 - life);
          dummyObj.position.set(
            pourState.impact.x + Math.cos(d.a) * d.r * life,
            pourState.impact.y + arc * d.h,
            pourState.impact.z + Math.sin(d.a) * d.r * life,
          );
          dummyObj.scale.setScalar(0.022 * amt * (1 - life * 0.4));
          dummyObj.updateMatrix();
          dr.setMatrixAt(i, dummyObj.matrix);
        });
        dr.instanceMatrix.needsUpdate = true;
      }
    }
  });

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      if (!spout.current) return 0;
      spout.current.getWorldPosition(out);
      return smoothstep(0.6, 0.66, p) * (1 - smoothstep(0.72, 0.76, p)) * 0.8;
    },
    [progress],
  );

  return (
    <>
      <group ref={root}>
        <group ref={tilt} scale={MOKA_SCALE}>
          <mesh geometry={geo.boiler} material={metal} />
          <mesh geometry={geo.funnel} material={metal} />
          <mesh ref={mound} position={[0, MOKA_FUNNEL_RIM / MOKA_SCALE - 0.08, 0]} material={coffee}>
            <coneGeometry args={[0.5, 0.34, 16]} />
          </mesh>
          <group ref={upper}>
            <mesh geometry={geo.upper} material={metal} />
            <mesh geometry={geo.lid} position={[0, 1.12, 0]} material={metal} />
            <mesh position={[0, 1.36, 0]} material={bakelite}>
              <sphereGeometry args={[0.1, 16, 12]} />
            </mesh>
            <mesh position={[0, 1.27, 0]} material={bakelite}>
              <cylinderGeometry args={[0.04, 0.05, 0.14, 10]} />
            </mesh>
            <mesh geometry={geo.handle} material={bakelite} />
            <mesh geometry={geo.spout} position={[0.78, 1.05, 0]} material={metal} />
          </group>
          <object3D ref={spout} position={[1.3, 1.92, 0]} />
        </group>
      </group>
      <mesh ref={stream} geometry={streamGeo} material={liquid} visible={false} frustumCulled={false} />
      <instancedMesh ref={drops} args={[undefined, liquid, 12]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 8, 6]} />
      </instancedMesh>
      <Steam count={6} state={steamState} size={0.34} rise={1.0} spread={0.1} />
    </>
  );
}
