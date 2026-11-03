"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  GRINDER_OUTLET_Y,
  GRINDER_SCALE,
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

/** Molino manual modelado en Blender: se echan los granos, se pone la tapa, se coloca la manivela y se muele. */
export function GrinderStation({ progress }: P) {
  const { scene } = useGLTF(MODEL_URLS.grinder);
  const model = useMemo(() => scene.clone(true), [scene]);
  const root = useRef<THREE.Group>(null);
  const asm = useRef<THREE.Group | null>(null);
  const crank = useRef<THREE.Object3D | null>(null);
  useLayoutEffect(() => {
    // La tapa, su aro y la manivela forman un solo conjunto: llegan juntos, se asientan juntos
    // y solo la manivela gira sobre la tapa (que queda quieta, como en un molino real).
    const parts = ["lid", "lid_ring", "crank"].map((n) => model.getObjectByName(n));
    if (parts.some((o) => !o)) return;
    const group = new THREE.Group();
    group.name = "lid_and_crank";
    model.add(group);
    parts.forEach((o) => group.add(o!));
    asm.current = group;
    crank.current = parts[2]!;
  }, [model]);

  useFrame(({ clock }) => {
    const p = progress.get();
    const grinding = smoothstep(0.41, 0.44, p) * (1 - smoothstep(0.48, 0.52, p));
    const g = asm.current;
    if (g) {
      // Con los granos ya dentro, el conjunto baja desde arriba y cierra la tolva.
      const settle = smoothstep(0.3, 0.355, p);
      g.visible = p > 0.295;
      g.position.y = (1 - settle) * 2.4;
      g.rotation.z = (1 - settle) * 0.35;
    }
    if (crank.current) crank.current.rotation.y = smoothstep(0.38, 0.52, p) * 30;
    if (root.current) {
      const t = clock.elapsedTime;
      root.current.position.x = Math.sin(t * 46) * 0.005 * grinding;
      root.current.position.z = Math.cos(t * 39) * 0.005 * grinding;
      root.current.visible = p > 0.13 && p < 0.6;
    }
  });

  return (
    <group ref={root} position={[0, GRINDER_Y, 0]} scale={GRINDER_SCALE}>
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
  const fine = useRef<THREE.Points>(null);
  const grains = useRef<THREE.Points>(null);
  const dot = useMemo(() => makeDotTexture(), []);
  const count = Math.round(grounds * 2);
  const seeds = useMemo(() => {
    const rnd = mulberry32(33);
    return Array.from({ length: count }, () => ({
      phase: rnd(),
      speed: 0.9 + rnd() * 0.5,
      a: rnd() * 6.28,
      r: Math.sqrt(rnd()),
    }));
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const grainCount = Math.round(grounds * 0.18);
  const grainSeeds = useMemo(() => {
    const rnd = mulberry32(77);
    return Array.from({ length: grainCount }, () => ({ phase: rnd(), speed: 1 + rnd() * 0.4, a: rnd() * 6.28, r: Math.sqrt(rnd()) }));
  }, [grainCount]);
  const grainPos = useMemo(() => new Float32Array(grainCount * 3), [grainCount]);

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.55, 0.61, p));
      out.set(0, mokaY + MOKA_FUNNEL_RIM + 0.1, 0);
      return smoothstep(0.43, 0.47, p) * (1 - smoothstep(0.50, 0.53, p)) * 0.3;
    },
    [progress],
  );

  useFrame(({ clock }) => {
    const p = progress.get();
    const active = smoothstep(0.41, 0.44, p) * (1 - smoothstep(0.50, 0.53, p));
    const t = clock.elapsedTime;
    const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.55, 0.61, p));
    // el café cae sobre la cima del montículo, que sube mientras muele
    const dose = smoothstep(0.42, 0.51, p);
    const floorY = mokaY + MOKA_FUNNEL_RIM + 0.05 + dose * 0.2;
    const top = GRINDER_OUTLET_Y - 0.06;
    const fall = top - floorY;
    const run = (pts: THREE.Points | null, arr: Float32Array, list: typeof seeds, rate: number, w0: number, w1: number) => {
      if (!pts) return;
      pts.visible = active > 0.01;
      if (!pts.visible) return;
      (pts.material as THREE.PointsMaterial).opacity = active;
      list.forEach((s, i) => {
        const life = (t * rate * s.speed + s.phase) % 1;
        const fell = life * life; // cae acelerando
        const width = (w0 + (w1 - w0) * fell) * s.r; // columna fina que se abre apenas
        arr[i * 3] = Math.cos(s.a) * width;
        arr[i * 3 + 1] = top - fall * fell;
        arr[i * 3 + 2] = Math.sin(s.a) * width;
      });
      pts.geometry.attributes.position.needsUpdate = true;
    };
    run(fine.current, positions, seeds, 1.5, 0.03, 0.07);
    run(grains.current, grainPos, grainSeeds, 1.5, 0.035, 0.08);
  });

  return (
    <>
      <points ref={fine} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#3a1f10" size={0.03} map={dot} alphaTest={0.35} transparent depthWrite={false} sizeAttenuation />
      </points>
      <points ref={grains} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[grainPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#5a3016" size={0.045} map={dot} alphaTest={0.35} transparent depthWrite={false} sizeAttenuation />
      </points>
      <Steam count={4} state={steamState} size={0.22} rise={0.35} spread={0.08} color="#8a6a4c" />
    </>
  );
}
