"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { COLOMBIA, GRINDER_HALF_H, GRINDER_OUTLET_Y, MOKA_ASSEMBLED_Y, MOKA_DOSING_Y, MOKA_FUNNEL_RIM, STATION_Y } from "./constants";
import { createGrinderGripGeometry, createGrinderHopperGeometry, createGrinderHousingGeometry } from "./geometries";
import { lerp, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";
import { makeDotTexture, makeWoodTexture } from "./textures";

type P = { progress: MotionValue<number> };

/** Molino manual cilíndrico: cuerpo negro acanalado, franjas tricolor, tapa de cobre y perilla de madera. */
export function GrinderStation({ progress }: P) {
  const { segments } = useQuality();
  const crank = useRef<THREE.Group>(null);
  const grip = useMemo(() => createGrinderGripGeometry(segments), [segments]);
  const housing = useMemo(() => createGrinderHousingGeometry(segments), [segments]);
  const hopper = useMemo(() => createGrinderHopperGeometry(segments), [segments]);

  const black = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1b1715", roughness: 0.42, metalness: 0.55, clearcoat: 0.25 }),
    [],
  );
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.28 }), []);
  const copper = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c8794a", metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
    [],
  );
  const wood = useMemo(() => {
    const map = makeWoodTexture();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.5, color: "#d99a6a" });
  }, []);
  const stripe = useMemo(
    () => ({
      y: new THREE.MeshStandardMaterial({ color: COLOMBIA.yellow, roughness: 0.4, metalness: 0.2 }),
      b: new THREE.MeshStandardMaterial({ color: COLOMBIA.blue, roughness: 0.4, metalness: 0.2 }),
      r: new THREE.MeshStandardMaterial({ color: COLOMBIA.red, roughness: 0.4, metalness: 0.2 }),
    }),
    [],
  );

  useFrame(() => {
    if (crank.current) crank.current.rotation.y = smoothstep(0.2, 0.5, progress.get()) * 26;
  });

  return (
    <group position={[0, STATION_Y.GRINDER, 0]}>
      <mesh geometry={grip} material={black} />
      {/* Franjas de la bandera (las mismas de la taza) */}
      <mesh position={[0, 0.24, 0]} material={stripe.y}>
        <cylinderGeometry args={[0.515, 0.515, 0.09, segments]} />
      </mesh>
      <mesh position={[0, 0.33, 0]} material={stripe.b}>
        <cylinderGeometry args={[0.515, 0.515, 0.09, segments]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={stripe.r}>
        <cylinderGeometry args={[0.515, 0.515, 0.09, segments]} />
      </mesh>
      <mesh geometry={housing} material={steel} />
      <mesh geometry={hopper} material={copper} />
      {/* Salida del café molido */}
      <mesh position={[0, -GRINDER_HALF_H + 0.04, 0]} material={steel}>
        <cylinderGeometry args={[0.42, 0.36, 0.14, segments]} />
      </mesh>
      {/* Manivela: eje + brazo + perilla de madera */}
      <group ref={crank}>
        <mesh position={[0, 1.55, 0]} material={steel}>
          <cylinderGeometry args={[0.05, 0.05, 1.0, 16]} />
        </mesh>
        <mesh position={[0.62, 2.02, 0]} rotation={[0, 0, Math.PI / 2]} material={steel}>
          <cylinderGeometry args={[0.05, 0.05, 1.3, 16]} />
        </mesh>
        <mesh position={[1.27, 2.18, 0]} material={wood}>
          <capsuleGeometry args={[0.11, 0.38, 6, 14]} />
        </mesh>
        <mesh position={[0, 2.04, 0]} material={copper}>
          <sphereGeometry args={[0.1, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/** Café molido cayendo de la salida del molino al filtro de la moka. */
export function GroundsFlow({ progress }: P) {
  const { grounds } = useQuality();
  const ref = useRef<THREE.Points>(null);
  const dot = useMemo(() => makeDotTexture(), []);
  const seeds = useMemo(() => {
    const rnd = mulberry32(33);
    return Array.from({ length: grounds }, () => ({
      phase: rnd(),
      speed: 0.7 + rnd() * 0.6,
      dx: (rnd() - 0.5) * 0.3,
      dz: (rnd() - 0.5) * 0.3,
    }));
  }, [grounds]);
  const positions = useMemo(() => new Float32Array(grounds * 3), [grounds]);

  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const p = progress.get();
    const active = smoothstep(0.22, 0.28, p) * (1 - smoothstep(0.47, 0.5, p));
    pts.visible = active > 0.01;
    if (!pts.visible) return;
    (pts.material as THREE.PointsMaterial).opacity = active;

    const t = clock.elapsedTime;
    const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p));
    const fall = GRINDER_OUTLET_Y - (mokaY + MOKA_FUNNEL_RIM + 0.15);
    seeds.forEach((s, i) => {
      const life = (t * 0.55 * s.speed + s.phase) % 1;
      positions[i * 3] = s.dx * life;
      positions[i * 3 + 1] = GRINDER_OUTLET_Y - fall * life * life;
      positions[i * 3 + 2] = s.dz * life;
    });
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#3a1d0e" size={0.055} map={dot} alphaTest={0.4} transparent depthWrite={false} sizeAttenuation />
    </points>
  );
}
