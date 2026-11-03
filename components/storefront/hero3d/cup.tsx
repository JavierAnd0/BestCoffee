"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { CUP_BASE_Y, CUP_INNER_R, CUP_ROT_Y, CUP_SCALE, LIQUID_MIN } from "./constants";
import { lerp, smoothstep } from "./math";
import { liquidLevel, pourActive } from "./pour";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeCremaTexture, makeShadowTexture } from "./textures";

type P = { progress: MotionValue<number> };

// Modelo original de la taza ("CAFÉ DE COLOMBIA"), comprimido: 2.5 MB → ~130 KB.
export const CUP_URL = "/models/taza.opt.glb?v=2";

export function CupStation({ progress }: P) {
  const { steam, segments } = useQuality();
  const { scene } = useGLTF(CUP_URL);
  const liquidGroup = useRef<THREE.Group>(null);
  const crema = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const cupGroup = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Group>(null);

  const cremaTex = useMemo(() => makeCremaTexture(), []);
  const shadowTex = useMemo(() => makeShadowTexture(), []);

  // El archivo ya viene limpio (sin la taza naranja duplicada y con el color crema fijado).
  const cup = useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    if (cupGroup.current) cupGroup.current.rotation.y = CUP_ROT_Y + Math.sin(t * 0.4) * 0.02;
    // Entra en escena justo antes de su estación (no asoma detrás del texto del moka).
    const appear = smoothstep(0.68, 0.75, p);
    if (outer.current) {
      outer.current.visible = appear > 0.01;
      outer.current.scale.setScalar(lerp(0.85, 1, appear));
    }

    const fill = smoothstep(0.83, 0.93, p);
    const pour = pourActive(p);
    const lg = liquidGroup.current;
    if (lg) {
      lg.visible = fill > 0.01;
      lg.position.y = liquidLevel(p);
      const rf = lerp(0.74, 0.985, Math.sqrt(fill));
      lg.scale.set(rf, 1, rf);
    }
    if (crema.current) crema.current.rotation.z = t * 0.35 + fill * 2.2;
    if (ring1.current && ring2.current) {
      const r1 = (t * 1.5) % 1;
      const r2 = (t * 1.5 + 0.5) % 1;
      ring1.current.scale.setScalar(0.12 + r1 * 0.86);
      ring2.current.scale.setScalar(0.12 + r2 * 0.86);
      (ring1.current.material as THREE.MeshBasicMaterial).opacity = (1 - r1) * 0.5 * pour;
      (ring2.current.material as THREE.MeshBasicMaterial).opacity = (1 - r2) * 0.5 * pour;
    }
  });

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      out.set(0, CUP_BASE_Y + LIQUID_MIN + 0.67 + 0.05, 0);
      return smoothstep(0.86, 0.97, progress.get());
    },
    [progress],
  );

  return (
    <>
      <group ref={outer} position={[0, CUP_BASE_Y, 0]}>
        {/* Sombra de contacto barata: un plano con degradado, sin sombras en tiempo real */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <planeGeometry args={[5.2, 5.2]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
        <group ref={cupGroup}>
          <group scale={CUP_SCALE}>
            <primitive object={cup} />
          </group>
          <group ref={liquidGroup} visible={false}>
            <mesh ref={crema} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[CUP_INNER_R, segments]} />
              <meshPhysicalMaterial map={cremaTex} roughness={0.16} metalness={0.08} clearcoat={0.85} clearcoatRoughness={0.12} />
            </mesh>
            <mesh ref={ring1} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
              <meshBasicMaterial color="#e2a872" transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh ref={ring2} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
              <meshBasicMaterial color="#e2a872" transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>
      <Steam count={steam} state={steamState} size={0.6} rise={1.7} spread={0.28} />
    </>
  );
}

useGLTF.preload(CUP_URL);
