"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  CUP_BASE_Y,
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
import { lerp, smoothstep } from "./math";
import { liquidLevel, pourActive } from "./pour";
import { Steam } from "./steam";

type P = { progress: MotionValue<number> };

/** Moka de aluminio: se arma por piezas, hierve y se inclina para servir en la taza. */
export function MokaStation({ progress }: P) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const mound = useRef<THREE.Mesh>(null);
  const spout = useRef<THREE.Object3D>(null);
  const stream = useRef<THREE.Mesh>(null);

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
  // Aluminio cepillado: la anisotropía estira el reflejo en vertical, como las vetas del metal real.
  const metal = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c2c7ce",
        metalness: 1,
        roughness: 0.3,
        anisotropy: 0.75,
        anisotropyRotation: Math.PI / 2,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const bakelite = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#161111", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    [],
  );
  const coffee = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b1509", roughness: 0.95 }), []);
  const liquid = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1208", roughness: 0.12, metalness: 0.1 }), []);
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
    r.visible = p > 0.2 && p < 0.945;

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
    const e = smoothstep(0.49, 0.58, p);
    up.visible = p > 0.47;
    up.position.set(lerp(2.8, 0, e), lerp(2.2, 0.95, e) + Math.sin(e * Math.PI) * 0.5, 0);
    up.rotation.z = (1 - e) * -0.5;

    // 4) El café molido va llenando el filtro mientras muele.
    if (mound.current) {
      const dose = smoothstep(0.26, 0.46, p);
      mound.current.scale.set(1, Math.max(dose, 0.001), 1);
      mound.current.visible = dose > 0.01;
    }

    // 5) Chorro: de la punta del pico a la superficie del café en la taza.
    if (stream.current) {
      spout.current.getWorldPosition(tmp);
      const surface = CUP_BASE_Y + liquidLevel(p);
      const amt = pourActive(p) > 0.02 ? smoothstep(0.82, 0.835, p) * (1 - smoothstep(0.9, 0.915, p)) : 0;
      const len = Math.max(tmp.y - surface, 0.001);
      stream.current.visible = amt > 0.01 && len > 0.02;
      const w = amt * (0.9 + Math.sin(t * 24) * 0.08);
      stream.current.position.set(tmp.x, surface + len / 2, tmp.z);
      stream.current.scale.set(w, len, w);
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
            <mesh geometry={geo.spout} position={[0.84, 1.05, 0]} material={metal} />
          </group>
          <object3D ref={spout} position={[1.1, 2.0, 0]} />
        </group>
      </group>
      <mesh ref={stream} material={liquid} visible={false}>
        <cylinderGeometry args={[0.04, 0.04, 1, 10, 1, true]} />
      </mesh>
      <Steam count={6} state={steamState} size={0.34} rise={1.0} spread={0.1} />
    </>
  );
}
