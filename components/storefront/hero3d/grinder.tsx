"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  COLOMBIA,
  GRINDER_HALF_H,
  GRINDER_OUTLET_Y,
  GRINDER_Y,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
  MOKA_FUNNEL_RIM,
} from "./constants";
import { createGrinderGripGeometry, createGrinderHopperGeometry, createGrinderHousingGeometry } from "./geometries";
import { lerp, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeDotTexture, makeWoodTexture } from "./textures";

type P = { progress: MotionValue<number> };

/** Molino manual: cuerpo negro acanalado, franjas de la bandera, tapa de cobre y manivela de madera. */
export function GrinderStation({ progress }: P) {
  const { segments } = useQuality();
  const root = useRef<THREE.Group>(null);
  const crank = useRef<THREE.Group>(null);
  const grip = useMemo(() => createGrinderGripGeometry(segments), [segments]);
  const housing = useMemo(() => createGrinderHousingGeometry(segments), [segments]);
  const hopper = useMemo(() => createGrinderHopperGeometry(segments), [segments]);

  const black = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#1b1715", roughness: 0.42, metalness: 0.55, clearcoat: 0.25 }),
    [],
  );
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.28, envMapIntensity: 1.4 }), []);
  const copper = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e08f5a", metalness: 1, roughness: 0.26, envMapIntensity: 1.7, side: THREE.DoubleSide }),
    [],
  );
  const wood = useMemo(() => {
    const map = makeWoodTexture();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.5, color: "#efd2aa" });
  }, []);
  const stripe = useMemo(
    () => ({
      y: new THREE.MeshStandardMaterial({ color: COLOMBIA.yellow, roughness: 0.4, metalness: 0.2 }),
      b: new THREE.MeshStandardMaterial({ color: COLOMBIA.blue, roughness: 0.4, metalness: 0.2 }),
      r: new THREE.MeshStandardMaterial({ color: COLOMBIA.red, roughness: 0.4, metalness: 0.2 }),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const p = progress.get();
    const grinding = smoothstep(0.3, 0.36, p) * (1 - smoothstep(0.46, 0.5, p));
    if (crank.current) crank.current.rotation.y = smoothstep(0.3, 0.48, p) * 30;
    if (root.current) {
      // leve vibración mientras muele
      const t = clock.elapsedTime;
      root.current.position.x = Math.sin(t * 46) * 0.006 * grinding;
      root.current.position.z = Math.cos(t * 39) * 0.006 * grinding;
      root.current.visible = p < 0.58;
    }
  });

  return (
    <group ref={root} position={[0, GRINDER_Y, 0]}>
      <mesh geometry={grip} material={black} />
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
      <mesh position={[0, -GRINDER_HALF_H + 0.04, 0]} material={steel}>
        <cylinderGeometry args={[0.42, 0.36, 0.14, segments]} />
      </mesh>
      {/* Manivela (eje corto: no atraviesa el montón de granos) */}
      <group ref={crank}>
        <mesh position={[0, 1.58, 0]} material={steel}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
        </mesh>
        <mesh position={[0.55, 1.86, 0]} rotation={[0, 0, Math.PI / 2]} material={steel}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 16]} />
        </mesh>
        <mesh position={[1.17, 2.02, 0]} material={wood}>
          <capsuleGeometry args={[0.11, 0.38, 6, 14]} />
        </mesh>
        <mesh position={[0, 1.86, 0]} material={copper}>
          <sphereGeometry args={[0.11, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Café molido: una cortina que sale por la boca del molino, con grumos y polvo fino,
 * cae acelerando y se abre apenas; al llegar al filtro levanta una nubecita.
 */
export function GroundsFlow({ progress }: P) {
  const { grounds } = useQuality();
  const lumps = useRef<THREE.InstancedMesh>(null);
  const dust = useRef<THREE.Points>(null);
  const dot = useMemo(() => makeDotTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lumpMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b1d0e", roughness: 0.9 }), []);
  const lumpGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

  const lumpCount = Math.round(grounds * 0.85);
  const lumpSeeds = useMemo(() => {
    const rnd = mulberry32(41);
    return Array.from({ length: lumpCount }, () => ({
      phase: rnd(),
      speed: 0.8 + rnd() * 0.5,
      a: rnd() * 6.28,
      spread: 0.05 + rnd() * 0.2,
      size: 0.016 + rnd() * 0.034,
      rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
    }));
  }, [lumpCount]);
  const seeds = useMemo(() => {
    const rnd = mulberry32(33);
    return Array.from({ length: grounds }, () => ({
      phase: rnd(),
      speed: 0.7 + rnd() * 0.6,
      a: rnd() * 6.28,
      spread: 0.03 + rnd() * 0.2,
    }));
  }, [grounds]);
  const positions = useMemo(() => new Float32Array(grounds * 3), [grounds]);

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p));
      out.set(0, mokaY + MOKA_FUNNEL_RIM + 0.1, 0);
      return smoothstep(0.34, 0.4, p) * (1 - smoothstep(0.46, 0.5, p)) * 0.55;
    },
    [progress],
  );

  useFrame(({ clock }) => {
    const p = progress.get();
    const active = smoothstep(0.32, 0.36, p) * (1 - smoothstep(0.47, 0.5, p));
    const t = clock.elapsedTime;
    const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p));
    const floorY = mokaY + MOKA_FUNNEL_RIM + 0.12;
    const fall = GRINDER_OUTLET_Y - 0.06 - floorY;

    if (lumps.current) {
      lumps.current.visible = active > 0.01;
      if (lumps.current.visible) {
        lumpSeeds.forEach((s, i) => {
          const life = (t * 0.6 * s.speed + s.phase) % 1;
          const open = s.spread * (0.3 + life);
          dummy.position.set(Math.cos(s.a) * open, GRINDER_OUTLET_Y - 0.06 - fall * life * life, Math.sin(s.a) * open);
          dummy.rotation.set(s.rot.x + life * 9, s.rot.y + life * 7, s.rot.z);
          dummy.scale.setScalar(s.size * active);
          dummy.updateMatrix();
          lumps.current!.setMatrixAt(i, dummy.matrix);
        });
        lumps.current.instanceMatrix.needsUpdate = true;
      }
    }
    const pts = dust.current;
    if (pts) {
      pts.visible = active > 0.01;
      if (pts.visible) {
        (pts.material as THREE.PointsMaterial).opacity = active * 0.9;
        seeds.forEach((s, i) => {
          const life = (t * 0.55 * s.speed + s.phase) % 1;
          const open = s.spread * life;
          positions[i * 3] = Math.cos(s.a + life) * open;
          positions[i * 3 + 1] = GRINDER_OUTLET_Y - 0.06 - fall * life * life;
          positions[i * 3 + 2] = Math.sin(s.a + life) * open;
        });
        pts.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <instancedMesh ref={lumps} args={[lumpGeo, lumpMat, lumpCount]} frustumCulled={false} />
      <points ref={dust} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#4a2a15" size={0.05} map={dot} alphaTest={0.4} transparent depthWrite={false} sizeAttenuation />
      </points>
      <Steam count={5} state={steamState} size={0.3} rise={0.5} spread={0.12} color="#8a6a4c" />
    </>
  );
}
