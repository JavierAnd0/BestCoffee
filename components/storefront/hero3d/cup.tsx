"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { CAFE_BG_URL, CAFE_BG_URL_MOBILE, CUP_BASE_Y, CUP_INNER_R, CUP_ROT_Y, CUP_SCALE, LIQUID_MAX, MODEL_URLS, SAUCER_H } from "./constants";
import { createSaucerGeometry } from "./geometries";
import { useBean } from "./assets";
import { lerp, mulberry32, smoothstep } from "./math";
import { liquidLevel, pourActive, pourState } from "./pour";
import { useQuality } from "./quality";
import { Steam } from "./steam";
import { makeCremaTexture, makeShadowTexture, makeTableTexture } from "./textures";

type P = { progress: MotionValue<number> };

const CUP_URL = MODEL_URLS.cup;
const CAFE_YAW = 1.6; // hacia qué parte de la cafetería mira la cámara final

/** Presentación final: taza y plato de loza sobre una mesa de nogal, con cucharita y granos esparcidos. */
export function CupStation({ progress }: P) {
  const { steam, segments, mobile } = useQuality();
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
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2; // la veta corre a lo ancho de la mesa
    t.repeat.set(2.2, 2.6);
    return t;
  }, []);
  // Fondo: foto 360° de una cafetería real (Poly Haven, CC0), ya desenfocada para simular poca profundidad de campo.
  const cafeSrc = useLoader(THREE.TextureLoader, mobile ? CAFE_BG_URL_MOBILE : CAFE_BG_URL);
  const cafeTex = useMemo(() => {
    const t = cafeSrc.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1; // se ve desde dentro de la esfera: se invierte para no verla en espejo
    t.offset.x = 1;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }, [cafeSrc]);
  const cafe = useRef<THREE.Mesh>(null);
  const { scene: biscuitScene } = useGLTF(MODEL_URLS.biscuit);
  const biscuits = useMemo(() => [biscuitScene.clone(true), biscuitScene.clone(true)], [biscuitScene]);
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
      const rad = 2.15 + rnd() * 1.1;
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
    if (cafe.current) {
      const f = smoothstep(0.78, 0.88, p);
      cafe.current.visible = f > 0.01;
      (cafe.current.material as THREE.MeshBasicMaterial).opacity = f;
    }
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
        {/* Mesa de nogal con grosor y borde (no un piso infinito) */}
        <mesh position={[-0.1, -0.21, 0]}>
          <boxGeometry args={[16, 0.42, 22]} />
          <meshStandardMaterial map={tableTex} roughness={0.38} metalness={0} envMapIntensity={0.8} />
        </mesh>
        {/* Sombra de contacto barata: un plano con degradado, sin sombras en tiempo real */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <planeGeometry args={[5.4, 5.4]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
        <mesh geometry={saucerGeo} material={porcelain} scale={[1.2, 1, 1.2]} />

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

        {/* Cucharita y dos bizcochos sobre el plato (el segundo se apoya inclinado en el primero) */}
        <group position={[0.95, SAUCER_H + 0.012, 0.62]} rotation={[0, Math.PI / 2 + 0.25, 0]} scale={1.3}>
          <primitive object={spoon} />
        </group>
        <group position={[0.98, SAUCER_H + 0.002, -0.42]} rotation={[0, 1.3, 0]} scale={0.95}>
          <primitive object={biscuits[0]} />
        </group>
        <group position={[1.12, SAUCER_H + 0.02, 0.08]} rotation={[0, 1.7, 0]} scale={0.9}>
          <primitive object={biscuits[1]} />
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
      {/* Cafetería de fondo: esfera con la foto, centrada bajo la mesa para que el piso quede lejos */}
      <mesh ref={cafe} position={[0, CUP_BASE_Y - 3.2, 0]} rotation={[0, CAFE_YAW, 0]} visible={false} renderOrder={-10}>
        <sphereGeometry args={[46, 48, 28]} />
        <meshBasicMaterial map={cafeTex} side={THREE.BackSide} transparent opacity={0} fog={false} toneMapped={false} depthWrite={false} />
      </mesh>
      <Steam count={steam} state={steamState} size={0.62} rise={1.8} spread={0.3} />
    </>
  );
}
