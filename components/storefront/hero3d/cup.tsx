"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { CUP_BASE_Y, CUP_INNER_R, CUP_ROT_Y, CUP_SCALE, LIQUID_MAX, SAUCER_H } from "./constants";
import { createBeanGeometry, createSaucerGeometry } from "./geometries";
import { lerp, smoothstep } from "./math";
import { makeBeanMaterial } from "./materials";
import { liquidLevel, pourActive, pourState } from "./pour";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeCremaTexture, makeNoiseTexture, makePanelaTexture, makeShadowTexture } from "./textures";

type P = { progress: MotionValue<number> };

// Modelo original de la taza ("CAFÉ DE COLOMBIA"), comprimido: 2.5 MB → ~140 KB.
export const CUP_URL = "/models/taza.opt.glb?v=2";

/** Presentación final: taza sobre plato con cucharita, granos y un trozo de panela. */
export function CupStation({ progress }: P) {
  const { steam, segments } = useQuality();
  const { scene } = useGLTF(CUP_URL);
  const outer = useRef<THREE.Group>(null);
  const cupGroup = useRef<THREE.Group>(null);
  const liquidGroup = useRef<THREE.Group>(null);
  const crema = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  const cremaTex = useMemo(() => makeCremaTexture(), []);
  const shadowTex = useMemo(() => makeShadowTexture(), []);
  const cup = useMemo(() => scene.clone(true), [scene]);
  const saucerGeo = useMemo(() => createSaucerGeometry(segments), [segments]);
  const beanGeo = useMemo(() => createBeanGeometry(), []);
  const beanMat = useMemo(() => makeBeanMaterial(), []);
  const porcelain = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#f8f4df", roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    [],
  );
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d0d4d9", metalness: 1, roughness: 0.22 }), []);
  const panela = useMemo(
    () => new THREE.MeshStandardMaterial({ map: makePanelaTexture(), bumpMap: makeNoiseTexture(64, 8), bumpScale: 1.2, roughness: 0.7 }),
    [],
  );

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const appear = smoothstep(0.7, 0.77, p);
    if (outer.current) {
      outer.current.visible = appear > 0.01;
      outer.current.scale.setScalar(lerp(0.9, 1, appear));
    }
    // En la presentación final la taza gira despacio para mostrar el asa y el logo.
    if (cupGroup.current) cupGroup.current.rotation.y = CUP_ROT_Y + smoothstep(0.92, 1, p) * 0.45 + Math.sin(t * 0.4) * 0.02;

    const fill = smoothstep(0.84, 0.92, p);
    const lg = liquidGroup.current;
    if (lg) {
      lg.visible = fill > 0.01;
      lg.position.y = liquidLevel(p);
      const rf = lerp(0.74, 0.985, Math.sqrt(fill));
      lg.scale.set(rf, 1, rf);
    }
    if (crema.current) crema.current.rotation.z = t * 0.35 + fill * 2.2;
    const pour = pourActive(p);
    if (ring1.current && ring2.current) {
      const r1 = (t * 1.5) % 1;
      const r2 = (t * 1.5 + 0.5) % 1;
      ring1.current.scale.setScalar(0.1 + r1 * 0.85);
      ring2.current.scale.setScalar(0.1 + r2 * 0.85);
      (ring1.current.material as THREE.MeshBasicMaterial).opacity = (1 - r1) * 0.5 * pour;
      (ring2.current.material as THREE.MeshBasicMaterial).opacity = (1 - r2) * 0.5 * pour;
      const ix = pourState.impact.x * 0.8;
      const iz = pourState.impact.z * 0.8;
      ring1.current.position.set(ix, 0.005, iz);
      ring2.current.position.set(ix, 0.005, iz);
    }
  });

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      out.set(0, CUP_BASE_Y + SAUCER_H + LIQUID_MAX + 0.02, 0);
      return smoothstep(0.88, 0.97, progress.get());
    },
    [progress],
  );

  return (
    <>
      <group ref={outer} position={[0, CUP_BASE_Y, 0]}>
        {/* Sombra de contacto barata: un plano con degradado, sin sombras en tiempo real */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <planeGeometry args={[5.4, 5.4]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
        <mesh geometry={saucerGeo} material={porcelain} />

        <group position={[0, SAUCER_H, 0]}>
          <group ref={cupGroup}>
            <group scale={CUP_SCALE}>
              <primitive object={cup} />
            </group>
            <group ref={liquidGroup} visible={false}>
              <mesh ref={crema} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[CUP_INNER_R, segments]} />
                <meshPhysicalMaterial map={cremaTex} roughness={0.16} metalness={0.08} clearcoat={0.85} clearcoatRoughness={0.12} />
              </mesh>
              <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
                <meshBasicMaterial color="#e2a872" transparent opacity={0} depthWrite={false} />
              </mesh>
              <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
                <meshBasicMaterial color="#e2a872" transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Cucharita, granos y panela sobre el plato */}
        <group position={[0.2, SAUCER_H + 0.02, 0.95]} rotation={[0, 0.5, 0]}>
          <mesh position={[0.34, 0.02, 0]} scale={[0.17, 0.045, 0.1]} material={steel}>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
          <mesh position={[-0.3, 0.005, 0]} material={steel}>
            <boxGeometry args={[0.62, 0.018, 0.05]} />
          </mesh>
        </group>
        {[
          [1.0, -0.5, 0.6],
          [1.12, -0.28, 2.1],
          [0.9, -0.68, 4.0],
        ].map(([x, z, r], i) => (
          <mesh key={i} geometry={beanGeo} material={beanMat} position={[x, SAUCER_H + 0.06, z]} rotation={[0.2, r, 0.1]} scale={0.14} />
        ))}
        <mesh position={[0.9, SAUCER_H + 0.1, 0.1]} rotation={[0, 0.4, 0]} material={panela}>
          <boxGeometry args={[0.3, 0.17, 0.3]} />
        </mesh>
      </group>
      <Steam count={steam} state={steamState} size={0.62} rise={1.8} spread={0.3} />
    </>
  );
}

useGLTF.preload(CUP_URL);

