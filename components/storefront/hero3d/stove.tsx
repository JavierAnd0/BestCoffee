"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { STOVE_Y } from "./constants";
import { mulberry32, smoothstep } from "./math";
import { makeSoftTexture } from "./textures";

type P = { progress: MotionValue<number> };

const FLAMES = 28;

/** Hornilla de gas: base, anillo del quemador, parrilla y una corona de llamas azules. */
export function Stove({ progress }: P) {
  const root = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2623", roughness: 0.55, metalness: 0.8 }), []);
  const grate = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1816", roughness: 0.6, metalness: 0.9 }), []);
  const flameMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#4f9dff", transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false }),
    [],
  );
  const glowMat = useMemo(
    () => new THREE.SpriteMaterial({ map: makeSoftTexture(), color: "#ff9a4a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    [],
  );
  const seeds = useMemo(() => {
    const rnd = mulberry32(61);
    return Array.from({ length: FLAMES }, () => ({ phase: rnd() * 6.28, speed: 6 + rnd() * 5 }));
  }, []);

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const on = smoothstep(0.56, 0.6, p) * (1 - smoothstep(0.73, 0.76, p));
    if (root.current) {
      // Cuando la moka se levanta, la hornilla sale de cuadro.
      root.current.visible = p > 0.4 && p < 0.86;
      // se desliza hacia un costado (derecha de pantalla), no atraviesa la taza
      root.current.position.z = -smoothstep(0.73, 0.8, p) * 7;
    }
    const fl = flameRef.current;
    if (fl) {
      fl.visible = on > 0.01;
      seeds.forEach((s, i) => {
        const a = (i / FLAMES) * Math.PI * 2;
        const h = (0.13 + 0.05 * Math.sin(t * s.speed + s.phase)) * on;
        dummy.position.set(Math.cos(a) * 0.5, 0.1 + h / 2, Math.sin(a) * 0.5);
        dummy.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15);
        dummy.scale.set(0.028, Math.max(h, 0.001), 0.028);
        dummy.updateMatrix();
        fl.setMatrixAt(i, dummy.matrix);
      });
      fl.instanceMatrix.needsUpdate = true;
    }
    if (glow.current) {
      (glow.current.material as THREE.SpriteMaterial).opacity = on * (0.55 + 0.1 * Math.sin(t * 9));
      glow.current.scale.setScalar(2.4);
    }
    if (light.current) light.current.intensity = on * (3 + Math.sin(t * 7) * 0.5);
  });

  return (
    <group ref={root} position={[0, STOVE_Y - 0.32, 0]}>
      <mesh position={[0, 0, 0]} material={metal}>
        <cylinderGeometry args={[1.5, 1.6, 0.22, 40]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={grate}>
        <torusGeometry args={[0.5, 0.07, 10, 36]} />
      </mesh>
      <instancedMesh ref={flameRef} args={[undefined, flameMat, FLAMES]} position={[0, 0.1, 0]} frustumCulled={false}>
        <coneGeometry args={[1, 1, 6]} />
      </instancedMesh>
      {/* Parrilla donde se apoya la moka (su cara superior = STOVE_Y) */}
      {[0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((r, i) => (
        <mesh key={i} position={[0, 0.32, 0]} rotation={[0, r, 0]} material={grate}>
          <boxGeometry args={[1.5, 0.05, 0.06]} />
        </mesh>
      ))}
      <sprite ref={glow} material={glowMat} position={[0, 0.5, 0]} />
      <pointLight ref={light} position={[0, 0.6, 0]} color="#ff9a4a" intensity={0} distance={5} decay={2} />
    </group>
  );
}
