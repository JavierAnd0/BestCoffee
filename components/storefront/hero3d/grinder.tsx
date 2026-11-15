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
} from "./constants";
import { mulberry32, smoothstep } from "./math";
import { groundState } from "./pour";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeDotTexture } from "./textures";

type P = { progress: MotionValue<number> };

/** Molino manual modelado en Blender: se echan los granos, se pone la tapa, se coloca la manivela y se muele. */
export function GrinderStation({ progress }: P) {
  const { scene } = useGLTF(MODEL_URLS.grinder);
  const model = useMemo(() => {
    const c = scene.clone(true);
    const knob = c.getObjectByName("knob") as THREE.Mesh | undefined;
    if (knob?.material) {
      // nogal muy oscuro y satinado (antes salía ámbar como un huevo)
      const m = (knob.material as THREE.MeshStandardMaterial).clone();
      m.color.set("#2a1608");
      m.roughness = 0.38;
      knob.material = m;
    }
    return c;
  }, [scene]);
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
      // la tapa entra desde arriba, asienta con un pequeño rebote
      const bounce = Math.sin(settle * Math.PI) * 0.0 + (settle > 0.85 ? Math.sin((settle - 0.85) * Math.PI / 0.15) * 0.04 : 0);
      g.position.y = (1 - settle) * 1.4 + bounce;
      g.rotation.z = (1 - settle) * 0.35;
    }
    if (crank.current) crank.current.rotation.y = smoothstep(0.38, 0.52, p) * 30;
    if (root.current) {
      const t = clock.elapsedTime;
      root.current.position.x = Math.sin(t * 46) * 0.005 * grinding;
      root.current.position.z = Math.cos(t * 39) * 0.005 * grinding;
      // sale de cuadro hacia arriba antes de que llegue la cámara superior de la moka (sin desaparecer de golpe)
      root.current.position.y = GRINDER_Y + smoothstep(0.545, 0.6, p) * 7;
      root.current.visible = p > 0.13 && p < 0.64;
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
  const { mobile } = useQuality();
  const grains = useRef<THREE.InstancedMesh>(null);
  const fine = useRef<THREE.Points>(null);
  const puff = useRef<THREE.Points>(null);
  const dot = useMemo(() => makeDotTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Granito angular (tetraedro irregular): a esta escala se lee como gránulo, no como esfera
  const grainGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const grainMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, metalness: 0 }), []);

  const nGrain = mobile ? 350 : 900;
  const nFine = mobile ? 500 : 1400;
  const nPuff = 26;
  const mk = (n: number, seed: number) => {
    const rnd = mulberry32(seed);
    return Array.from({ length: n }, (_, i) => ({
      phase: (i + rnd() * 0.9) / n, // reparto parejo a lo largo de toda la caída
      dx: rnd() - 0.5,
      dz: rnd() - 0.5,
      r: Math.sqrt(rnd()),
      size: 0.007 + Math.pow(rnd(), 2.0) * 0.010, // muchos muy pequeños, pocos más grandes
      rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
      tone: rnd(),
    }));
  };
  const grainSeeds = useMemo(() => mk(nGrain, 77), [nGrain]);
  const fineSeeds = useMemo(() => mk(nFine, 33), [nFine]);
  const puffSeeds = useMemo(() => mk(nPuff, 5), []);
  const finePos = useMemo(() => new Float32Array(nFine * 3), [nFine]);
  const puffPos = useMemo(() => new Float32Array(nPuff * 3), []);

  // color por gránulo: de marrón oscuro a marrón rojizo medio, con unas pocas motas claras
  useLayoutEffect(() => {
    const m = grains.current;
    if (!m) return;
    const c = new THREE.Color();
    const dark = new THREE.Color("#3a1d0d");
    const mid = new THREE.Color("#7a4a28");
    const light = new THREE.Color("#a8754a");
    grainSeeds.forEach((s, i) => {
      c.copy(dark).lerp(mid, s.tone);
      if (s.tone > 0.9) c.lerp(light, (s.tone - 0.9) * 8);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [grainSeeds]);

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      out.set(0, Math.max(groundState.topY, -50) + 0.05, 0);
      return smoothstep(0.45, 0.5, p) * (1 - smoothstep(0.52, 0.56, p)) * 0.25;
    },
    [progress],
  );

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const active = smoothstep(0.425, 0.445, p) * (1 - smoothstep(0.525, 0.545, p));
    const on = active > 0.01;
    const top = GRINDER_OUTLET_Y + 0.12; // nace dentro de la boca de salida (queda tapado por ella)
    const bottom = groundState.topY > -900 ? groundState.topY : GRINDER_OUTLET_Y - 1.6;
    const fall = Math.max(top - bottom, 0.05);
    // La manivela gira ~ 2 vueltas por segundo de scroll continuo: la densidad "late" con cada vuelta
    const pulse = 0.75 + 0.25 * Math.sin(t * 9);

    if (grains.current) {
      grains.current.visible = on;
      if (on) {
        grainSeeds.forEach((s, i) => {
          const life = (t * 0.85 + s.phase) % 1;
          const f = life * (0.55 + 0.45 * life); // acelera con suavidad
          const w = (0.02 + 0.04 * f) * s.r;
          dummy.position.set(s.dx * 2 * w, top - fall * f, s.dz * 2 * w);
          dummy.rotation.set(s.rot.x + life * 10, s.rot.y + life * 8, s.rot.z);
          const k = Math.min(1, life * 18) * (1 - smoothstep(0.94, 1, life));
          dummy.scale.setScalar(s.size * k * active * (s.tone < pulse ? 1 : 0.0001));
          dummy.updateMatrix();
          grains.current!.setMatrixAt(i, dummy.matrix);
        });
        grains.current.instanceMatrix.needsUpdate = true;
      }
    }
    if (fine.current) {
      fine.current.visible = on;
      if (on) {
        (fine.current.material as THREE.PointsMaterial).opacity = active;
        fineSeeds.forEach((s, i) => {
          const life = (t * 1.0 + s.phase) % 1;
          const f = life * (0.55 + 0.45 * life);
          const w = (0.016 + 0.045 * f) * s.r;
          finePos[i * 3] = s.dx * 2 * w;
          finePos[i * 3 + 1] = top - fall * f;
          finePos[i * 3 + 2] = s.dz * 2 * w;
        });
        fine.current.geometry.attributes.position.needsUpdate = true;
      }
    }
    // nubecita de polvo al impactar sobre la cima
    if (puff.current) {
      puff.current.visible = on;
      if (on) {
        (puff.current.material as THREE.PointsMaterial).opacity = active * 0.5;
        puffSeeds.forEach((s, i) => {
          const life = (t * 0.9 + s.phase) % 1;
          const rad = 0.03 + life * 0.2 * s.r;
          puffPos[i * 3] = s.dx * 2 * rad;
          puffPos[i * 3 + 1] = bottom + 0.01 + life * 0.12;
          puffPos[i * 3 + 2] = s.dz * 2 * rad;
        });
        puff.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <instancedMesh ref={grains} args={[grainGeo, grainMat, nGrain]} frustumCulled={false} />
      <points ref={fine} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[finePos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#5a3318" size={0.028} map={dot} alphaTest={0.3} transparent depthWrite={false} sizeAttenuation />
      </points>
      <points ref={puff} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[puffPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7a5030" size={0.045} map={dot} alphaTest={0.2} transparent depthWrite={false} sizeAttenuation />
      </points>
      <Steam count={3} state={steamState} size={0.18} rise={0.3} spread={0.06} color="#8a6a4c" />
    </>
  );
}
