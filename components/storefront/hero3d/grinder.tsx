"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  GRINDER_OUTLET_Y,
  GRINDER_Y,
  MODEL_URLS,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
  MOKA_FUNNEL_RIM,
} from "./constants";
import { lerp, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeDotTexture } from "./textures";

type P = { progress: MotionValue<number> };

/** Molino manual modelado en Blender; la manivela gira y el cuerpo vibra al moler. */
export function GrinderStation({ progress }: P) {
  const { scene } = useGLTF(MODEL_URLS.grinder);
  const model = useMemo(() => scene.clone(true), [scene]);
  const root = useRef<THREE.Group>(null);
  const crank = useRef<THREE.Object3D | null>(null);
  useLayoutEffect(() => {
    crank.current = model.getObjectByName("crank") ?? null;
  }, [model]);

  useFrame(({ clock }) => {
    const p = progress.get();
    const grinding = smoothstep(0.3, 0.36, p) * (1 - smoothstep(0.46, 0.5, p));
    const c = crank.current;
    if (c) {
      // La manivela se retira para echar los granos y se coloca justo antes de moler.
      const settle = smoothstep(0.27, 0.33, p);
      c.visible = p > 0.26;
      c.position.y = 1.46 + (1 - settle) * 2.2;
      c.rotation.set(0, smoothstep(0.31, 0.48, p) * 30, (1 - settle) * 0.35);
    }
    if (root.current) {
      const t = clock.elapsedTime;
      root.current.position.x = Math.sin(t * 46) * 0.006 * grinding;
      root.current.position.z = Math.cos(t * 39) * 0.006 * grinding;
      root.current.visible = p < 0.58;
    }
  });

  return (
    <group ref={root} position={[0, GRINDER_Y, 0]}>
      <primitive object={model} />
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
