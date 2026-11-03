"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { CUP_BASE_Y, CUP_INNER_R, CUP_ROT_Y, CUP_SCALE, LIQUID_MAX, MODEL_URLS, SAUCER_H } from "./constants";
import { createSaucerGeometry } from "./geometries";
import { useBean } from "./assets";
import { lerp, mulberry32, smoothstep } from "./math";
import { liquidLevel, pourActive, pourState } from "./pour";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeCremaTexture, makeShadowTexture, makeTableMask, makeTableTexture } from "./textures";

type P = { progress: MotionValue<number> };

const CUP_URL = MODEL_URLS.cup;

/** Presentación final: taza y plato de loza sobre una mesa de nogal, con cucharita y granos esparcidos. */
export function CupStation({ progress }: P) {
  const { steam, segments } = useQuality();
  const { scene } = useGLTF(CUP_URL);
  const { scene: spoonScene } = useGLTF(MODEL_URLS.spoon);
  const outer = useRef<THREE.Group>(null);
  const cupGroup = useRef<THREE.Group>(null);
  const liquidGroup = useRef<THREE.Group>(null);
  const crema = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  const cremaTex = useMemo(() => makeCremaTexture(), []);
  const shadowTex = useMemo(() => makeShadowTexture(), []);
  const tableTex = useMemo(() => {
    const t = makeTableTexture();
    t.repeat.set(7, 7);
    return t;
  }, []);
  const tableMask = useMemo(() => makeTableMask(), []);
  const cup = useMemo(() => scene.clone(true), [scene]);
  const spoon = useMemo(() => spoonScene.clone(true), [spoonScene]);
  const saucerGeo = useMemo(() => createSaucerGeometry(segments), [segments]);
  const { geometry: beanGeo, material: beanMat } = useBean();
  const porcelain = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#f6f1e2", roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    [],
  );
  // Granos esparcidos sobre la mesa, fuera del plato (radio del plato ≈ 1.36)
  const scattered = useMemo(() => {
    const rnd = mulberry32(5);
    const out: { x: number; z: number; r: number; flip: boolean }[] = [];
    let guard = 0;
    while (out.length < 9 && guard++ < 200) {
      const a = -0.55 + (rnd() - 0.5) * 2.3; // hacia la cámara y el lado derecho (z<0): lejos del texto
      const rad = 1.85 + rnd() * 1.15;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (out.every((o) => Math.hypot(o.x - x, o.z - z) > 0.34)) out.push({ x, z, r: rnd() * 6.28, flip: rnd() > 0.7 });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const appear = smoothstep(0.76, 0.8, p);
    if (outer.current) {
      outer.current.visible = appear > 0.01;
      outer.current.scale.setScalar(lerp(0.9, 1, appear));
    }
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
        {/* Mesa de nogal: un disco con degradado que se funde con el fondo (sin bordes duros) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial map={tableTex} alphaMap={tableMask} transparent roughness={0.42} metalness={0} depthWrite={false} envMapIntensity={0.7} />
        </mesh>
        {/* Sombra de contacto barata: un plano con degradado, sin sombras en tiempo real */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
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

        {/* Cucharita apoyada en el plato, a la derecha de la taza */}
        <group position={[0.8, SAUCER_H + 0.012, 0.0]} rotation={[0, Math.PI / 2 + 0.2, 0]} scale={1.45}>
          <primitive object={spoon} />
        </group>

        {/* Granos esparcidos sobre la mesa, nunca sobre el borde del plato */}
        {scattered.map((b, i) => (
          <mesh
            key={i}
            geometry={beanGeo}
            material={beanMat}
            position={[b.x, 0.07, b.z]}
            rotation={[b.flip ? Math.PI : 0.0, b.r, 0]}
            scale={0.125}
          />
        ))}
      </group>
      <Steam count={steam} state={steamState} size={0.62} rise={1.8} spread={0.3} />
    </>
  );
}
