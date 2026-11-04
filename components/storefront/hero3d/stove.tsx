"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { STOVE_Y } from "./constants";
import { mulberry32, smoothstep } from "./math";
import { makeSoftTexture } from "./textures";

type P = { progress: MotionValue<number> };

const FLAMES = 56;

/** Lengua de llama: gota de base ancha y punta fina, con degradado de color/alfa a lo largo (azul intenso → casi transparente). */
function createFlameGeometry() {
  const sides = 10;
  const rings = 8;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings; // 0 base, 1 punta
    const rad = Math.pow(Math.sin(Math.PI * Math.min(1, 0.18 + t * 0.82)), 0.9) * (1 - t * 0.55);
    const y = t;
    // color: azul saturado en la base, celeste hacia arriba; alfa baja hacia la punta
    const k = Math.pow(t, 0.8);
    const c: [number, number, number] = [0.08 + 0.3 * k, 0.3 + 0.4 * k, 0.95];
    const a = 0.85 * (1 - Math.pow(t, 1.3)) * (t < 0.08 ? 0.55 + t * 5.6 : 1);
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2;
      pos.push(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      col.push(c[0], c[1], c[2], a);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let i = 0; i < sides; i++) {
      const a = r * sides + i;
      const b = r * sides + ((i + 1) % sides);
      const c = (r + 1) * sides + i;
      const d = (r + 1) * sides + ((i + 1) % sides);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  return g;
}

/** Hornilla de gas: base, anillo del quemador, parrilla y una corona de llamas azules. */
export function Stove({ progress }: P) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0f0d0c", roughness: 0.42, metalness: 0.55 }), []);
  const grate = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1816", roughness: 0.6, metalness: 0.9 }), []);
  const flameGeo = useMemo(() => createFlameGeometry(), []);
  const flameMat = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
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
    const on = smoothstep(0.62, 0.65, p) * (1 - smoothstep(0.73, 0.76, p));
    if (root.current) {
      // Cuando la moka se levanta, la hornilla sale de cuadro.
      // Solo se oculta la geometría: la luz puntual se queda siempre en la escena. Cambiar el número de luces
      // obliga a three.js a recompilar TODOS los materiales (tirón de 100+ ms).
      if (body.current) body.current.visible = p > 0.6 && p < 0.79;
      // se desliza hacia un costado (derecha de pantalla), no atraviesa la taza
      root.current.position.z = -smoothstep(0.72, 0.77, p) * 7;
    }
    const fl = flameRef.current;
    if (fl) {
      fl.visible = on > 0.01;
      seeds.forEach((s, i) => {
        const a = (i / FLAMES) * Math.PI * 2;
        const h = (0.26 + 0.07 * Math.sin(t * s.speed + s.phase) + 0.03 * Math.sin(t * s.speed * 2.3 + s.phase * 3)) * on;
        dummy.position.set(Math.cos(a) * 0.8, 0.1, Math.sin(a) * 0.8);
        dummy.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1);
        dummy.scale.set(0.17, Math.max(h, 0.001), 0.17);
        dummy.updateMatrix();
        fl.setMatrixAt(i, dummy.matrix);
      });
      fl.instanceMatrix.needsUpdate = true;
    }
    if (glow.current) {
      (glow.current.material as THREE.SpriteMaterial).opacity = on * (0.55 + 0.1 * Math.sin(t * 9));
      glow.current.scale.setScalar(3.6);
    }
    if (light.current) light.current.intensity = on * (3 + Math.sin(t * 7) * 0.5);
  });

  return (
    <group ref={root} position={[0, STOVE_Y - 0.32, 0]}>
      <group ref={body}>
      <mesh position={[0, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.92, 0.98, 0.1, 48]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={grate}>
        <torusGeometry args={[0.8, 0.06, 10, 48]} />
      </mesh>
      <instancedMesh ref={flameRef} args={[undefined, flameMat, FLAMES]} position={[0, 0.1, 0]} frustumCulled={false}>
        <primitive object={flameGeo} attach="geometry" />
      </instancedMesh>
      {/* Parrilla donde se apoya la moka (su cara superior = STOVE_Y) */}
      {[0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].map((r, i) => (
        <mesh key={i} position={[0, 0.32, 0]} rotation={[0, r, 0]} material={grate}>
          <boxGeometry args={[1.22, 0.05, 0.06]} />
        </mesh>
      ))}
      <sprite ref={glow} material={glowMat} position={[0, 0.5, 0]} />
      </group>
      <pointLight ref={light} position={[0, 0.6, 0]} color="#ff9a4a" intensity={0} distance={5} decay={2} />
    </group>
  );
}
