"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  CUP_BASE_Y,
  GROUNDS_MAPS,
  MODEL_URLS,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
  MOKA_HEIGHT,
  MOKA_SCALE,
  MOKA_UPPER_Y,
  MOKA_YAW,
  POUR_TARGET,
  POUR_TILT,
  SAUCER_H,
} from "./constants";
import { lerp, mulberry32, smoothstep } from "./math";
import { groundState, liquidLevel, mokaState, pourActive, setPourAmount, setPourImpact } from "./pour";
import { createPileGeometry, createPileMaterial } from "./pile";
import { Steam } from "./steam";

type P = { progress: MotionValue<number> };

const RINGS = 22;
const SIDES = 8;

/**
 * Moka Bialetti (modelada en Blender): se arma por piezas, hierve y se inclina para servir.
 * El chorro es una cinta de geometría que sigue una parábola desde la punta del pico.
 */
export function MokaStation({ progress }: P) {
  const { scene } = useGLTF(MODEL_URLS.moka);
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = (mesh.material as THREE.MeshStandardMaterial).clone();
      // El aluminio debe verse como metal (reflejos con contraste), no como cerámica blanca.
      if (m.name === "aluminio") {
        m.color.multiplyScalar(0.62);
        m.roughness = 0.36;
        m.envMapIntensity = 1.0;
      }
      if (m.name === "aluminio_int") {
        // interior del filtro: gris oscuro mate (antes el fondo vacío salía como un disco blanco)
        m.color.set("#4a4744");
        m.roughness = 0.6;
        m.envMapIntensity = 0.5;
      }
      // Baquelita: negro brillante de verdad (el export la deja gris con la luz de estudio).
      if (m.name === "baquelita") {
        m.color.set("#0a0807");
        m.roughness = 0.16;
        m.metalness = 0;
        m.envMapIntensity = 0.55;
      }
      mesh.material = m;
    });
    return c;
  }, [scene]);
  const groundMaps = useLoader(THREE.TextureLoader, [GROUNDS_MAPS.albedo, GROUNDS_MAPS.normal, GROUNDS_MAPS.rough]);
  const pileGeo = useMemo(() => createPileGeometry(), []);
  const pileMat = useMemo(
    () => createPileMaterial({ albedo: groundMaps[0].clone(), normal: groundMaps[1].clone(), rough: groundMaps[2].clone() }),
    [groundMaps],
  );

  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const moundRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const fillGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 56, 1, false), []);
  const upper = useRef<THREE.Object3D | null>(null);
  const tip = useRef<THREE.Object3D | null>(null);
  const stream = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    upper.current = model.getObjectByName("upper_group") ?? null;
    tip.current = model.getObjectByName("spout_tip") ?? null;
  }, [model]);

  const liquid = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#5b2b11", emissive: "#2b1005", emissiveIntensity: 0.9, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.6 }),
    [],
  );
  const dummyObj = useMemo(() => new THREE.Object3D(), []);
  const dropSeeds = useMemo(() => {
    const rnd = mulberry32(88);
    return Array.from({ length: 12 }, () => ({ phase: rnd(), a: rnd() * 6.28, r: 0.1 + rnd() * 0.22, h: 0.12 + rnd() * 0.2 }));
  }, []);
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
    const marker = tip.current;
    const p = progress.get();
    const t = clock.elapsedTime;

    // Solo existe mientras le toca: no asoma antes ni se queda después.
    if (r) r.visible = p > 0.385 && p < 0.975;
    if (!r || !tl || !up || !marker) return;

    // 1) Dosificación → armada: la caldera baja a la hornilla.
    // Sube desde abajo hasta quedar bajo la salida del molino (no aparece de golpe).
    const enter = smoothstep(0.39, 0.44, p);
    base.set(0, lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.55, 0.61, p)) - (1 - enter) * 3.0, 0);

    // 2) Servir: se inclina y su pico queda justo sobre la taza.
    const pourIn = smoothstep(0.72, 0.8, p);
    const pour = pourIn * (1 - smoothstep(0.925, 0.97, p));
    tl.rotation.z = -POUR_TILT * pour;
    r.rotation.set(0, MOKA_YAW, 0);
    r.position.copy(base);
    const brewing = smoothstep(0.62, 0.67, p) * (1 - pourIn);
    r.position.x += Math.sin(t * 38) * 0.004 * brewing;

    // Mientras solo está la caldera con el filtro, su centro visible es más bajo; al llegar la cámara superior sube.
    mokaState.centerY = base.y + lerp(0.75, MOKA_HEIGHT / 2, smoothstep(0.54, 0.64, p));
    r.updateMatrixWorld(true);
    marker.getWorldPosition(tmp);
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
    const e = smoothstep(0.54, 0.64, p);
    up.visible = p > 0.53;
    up.position.set(lerp(2.2, 0, e), MOKA_UPPER_Y + lerp(1.7, 0, e) + Math.sin(e * Math.PI) * 0.45, 0);
    up.rotation.z = (1 - e) * 0.5;

    // 4) El café molido se acumula en el filtro: empieza como un punto bajo el hilo (cuando llegan los
    //    primeros granos), forma un cono y luego se ensancha y se empareja.
    const m = moundRef.current;
    if (m) {
      const dose = smoothstep(0.43, 0.535, p);
      const level = smoothstep(0.545, 0.575, p);
      m.visible = dose > 0.005 && p < 0.9;
      if (fillRef.current) fillRef.current.visible = m.visible;
      // El embudo es un cono (radio 0.3 en el fondo y 0.7 en el borde): el café va llenándolo.
      // Primero forma un montículo en el fondo; luego sube el nivel y se ensancha hasta tocar la pared.
      const L = lerp(0.8, 1.13, smoothstep(0.3, 1, dose));
      const wall = (0.3 + (L - 0.7) * 0.87) * 1.03; // radio del embudo a esa altura
      const rad = lerp(0.06, wall, Math.pow(dose, 0.55));
      const hgt = Math.max(rad * 0.72 * (1 - level * 0.7), 0.001); // ángulo de reposo ≈ 35°; al final se empareja
      m.position.y = L - 0.015;
      m.scale.set(rad, hgt, rad);
      // Relleno: tronco de cono pegado a la pared del embudo, del fondo hasta el nivel actual
      const f = fillRef.current;
      if (f) {
        f.visible = true;
        const pos = f.geometry.attributes.position as THREE.BufferAttribute;
        const rBottom = 0.37 * 1.0;
        for (let i = 0; i < pos.count; i++) {
          const isTop = pos.getY(i) > 0;
          const ux = pos.getX(i);
          const uz = pos.getZ(i);
          const len = Math.hypot(ux, uz) || 1;
          const rr = isTop ? wall : rBottom;
          pos.setXYZ(i, (ux / len) * rr * (len > 0.0001 ? 1 : 0), isTop ? L - 0.02 : 0.8, (uz / len) * rr * (len > 0.0001 ? 1 : 0));
        }
        pos.needsUpdate = true;
        f.geometry.computeVertexNormals();
        f.geometry.computeBoundingSphere();
      }
      groundState.topY = r.position.y + (L + hgt) * MOKA_SCALE;
    }

    // 5) Chorro: parábola desde la punta del pico hasta la superficie del café.
    marker.getWorldPosition(tmp);
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
        const vh = 0.9 * amt;
        const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i <= RINGS; i++) {
          const sN = i / RINGS;
          const tt = sN * T;
          const cy = tmp.y - 0.5 * G * tt * tt;
          const cz = tmp.z + vh * tt;
          const wobble = 1 + 0.1 * Math.sin(sN * 16 - t * 14);
          const rad = Math.max(0.016, 0.075 * (1 - 0.45 * sN) * Math.sqrt(amt)) * wobble;
          for (let j = 0; j < SIDES; j++) {
            const a = (j / SIDES) * Math.PI * 2;
            pos.setXYZ(i * SIDES + j, tmp.x + Math.cos(a) * rad, cy, cz + Math.sin(a) * rad);
          }
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingSphere();
        setPourImpact(tmp.x, surface, tmp.z + vh * T);
      }
    }
    const dr = drops.current;
    if (dr) {
      dr.visible = amt > 0.05;
      if (dr.visible) {
        const ix = tmp.x;
        const iz = tmp.z + 0.9 * amt * Math.sqrt((2 * Math.max(tmp.y - surface, 0.01)) / 7);
        dropSeeds.forEach((d, i) => {
          const life = (t * 1.7 + d.phase) % 1;
          dummyObj.position.set(ix + Math.cos(d.a) * d.r * life, surface + 4 * life * (1 - life) * d.h, iz + Math.sin(d.a) * d.r * life);
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
      if (!tip.current) return 0;
      tip.current.getWorldPosition(out);
      return smoothstep(0.6, 0.66, p) * (1 - smoothstep(0.72, 0.76, p)) * 0.8;
    },
    [progress],
  );

  return (
    <>
      <group ref={root}>
        <group ref={tilt} scale={MOKA_SCALE}>
          <primitive object={model} />
          <group ref={moundRef} position={[0, 0.8, 0]} visible={false}>
            <mesh geometry={pileGeo} material={pileMat} />
          </group>
          <mesh ref={fillRef} geometry={fillGeo} material={pileMat} visible={false} frustumCulled={false} />
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
