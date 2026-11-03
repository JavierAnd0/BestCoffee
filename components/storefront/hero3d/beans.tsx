"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { useBean } from "./assets";
import { GRINDER_PILE_Y, GRINDER_TOP_Y, MODEL_URLS } from "./constants";
import { clamp01, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";

type P = { progress: MotionValue<number> };

const BEAN_SCALE = 0.125; // el grano del modelo mide 2 → 0.25 (≈1.2 cm reales)
const FLIGHT = 0.085; // cuánto scroll dura el vuelo de cada grano

/** Trayectoria elegante: sale del racimo, hace una curva amplia y baja hasta la tolva. */
const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.5, 1.0, 0.9),
    new THREE.Vector3(1.5, -0.9, 0.9),
    new THREE.Vector3(0.9, -2.3, 0.45),
    new THREE.Vector3(0.18, GRINDER_TOP_Y + 0.9, 0.04),
    new THREE.Vector3(0, GRINDER_PILE_Y + 0.2, 0),
  ],
  false,
  "catmullrom",
  0.5,
);

/**
 * ESTACIÓN 1 — de la rama al molino.
 * Un racimo de granos flota junto a una rama de cafeto con cerezas; luego los granos se
 * desprenden en un hilo continuo que baja en curva hasta la tolva, donde se apilan y se muelen.
 */
export function BeansStation({ progress }: P) {
  const { beans } = useQuality();
  const { geometry, material } = useBean();
  const { scene: branchScene } = useGLTF(MODEL_URLS.branch);
  const branch = useMemo(() => branchScene.clone(true), [branchScene]);
  const branchRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const items = useMemo(() => {
    const rnd = mulberry32(21);
    const raw = Array.from({ length: beans }, () => {
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      const r = Math.cbrt(rnd()) * 1.15;
      return {
        home: new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), 0.3 + r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th)),
        v: rnd(),
      };
    });
    // los de arriba salen primero
    raw.sort((a, b) => b.home.y - a.home.y);
    return raw.map((b, i) => {
      const pr = Math.sqrt(rnd()) * 0.2;
      const pa = rnd() * Math.PI * 2;
      return {
        home: b.home,
        te: 0.11 + (i / beans) * 0.10,
        side: new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.5),
        rest: new THREE.Vector3(Math.cos(pa) * pr, GRINDER_PILE_Y + 0.1 + (1 - (pr / 0.2) ** 2) * 0.14 + rnd() * 0.04, Math.sin(pa) * pr),
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: new THREE.Vector3((rnd() - 0.5) * 7, (rnd() - 0.5) * 7, (rnd() - 0.5) * 7),
        scale: BEAN_SCALE * (0.9 + rnd() * 0.2),
        phase: rnd() * 6.28,
        eat: 0.41 + rnd() * 0.09,
        shade: 0.85 + rnd() * 0.5,
      };
    });
  }, [beans]);

  useLayoutEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const c = new THREE.Color();
    items.forEach((it, i) => m.setColorAt(i, c.setRGB(it.shade, it.shade, it.shade)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    const p = progress.get();
    const t = clock.elapsedTime;

    m.visible = p < 0.54;
    if (m.visible) {
      items.forEach((it, i) => {
        const f = clamp01((p - it.te) / FLIGHT);
        if (p < it.te) {
          // flotando en el racimo, con un vaivén suave
          dummy.position.set(it.home.x, it.home.y + Math.sin(t * 0.7 + it.phase) * 0.06, it.home.z);
          dummy.rotation.set(it.rot.x + t * 0.1 * it.spin.x, it.rot.y + t * 0.1 * it.spin.y, it.rot.z);
          dummy.scale.setScalar(it.scale);
        } else if (f < 1) {
          // vuelo por la curva (arranca lento, acelera al caer); se abre un poco y converge en la tolva
          const e = f * f * (3 - 2 * f) * 0.35 + f * 0.65;
          PATH.getPoint(e, tmp);
          const open = Math.sin(e * Math.PI) * 1.0 * (1 - e * 0.4);
          tmp.x += it.side.x * open;
          tmp.y += it.side.y * open;
          tmp.z += it.side.z * open;
          const land = smoothstep(0.82, 1, f);
          tmp.lerp(it.rest, land);
          dummy.position.copy(tmp);
          dummy.rotation.set(it.rot.x + it.spin.x * f * 3, it.rot.y + it.spin.y * f * 3, it.rot.z + it.spin.z * f * 3);
          dummy.scale.setScalar(it.scale);
        } else {
          // apilado en la tolva; el molino lo va consumiendo
          const eaten = smoothstep(it.eat, it.eat + 0.06, p);
          dummy.position.copy(it.rest);
          dummy.rotation.set(it.rot.x + it.spin.x * 3, it.rot.y + it.spin.y * 3, it.rot.z + it.spin.z * 3);
          dummy.scale.setScalar(Math.max(it.scale * (1 - eaten), 0.0001));
        }
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }

    // La rama de cafeto acompaña el primer plano y se aparta cuando empieza la caída.
    const b = branchRef.current;
    if (b) {
      const fade = 1 - smoothstep(0.08, 0.17, p);
      b.visible = fade > 0.01;
      b.position.set(0.2, -0.1 + (1 - fade) * 1.4, -1.2);
      b.rotation.y = Math.PI / 2 + Math.sin(t * 0.3) * 0.04;
      b.scale.setScalar(Math.max(fade, 0.0001) * 0.82);
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[geometry, material, beans]} frustumCulled={false} />
      <group ref={branchRef}>
        <primitive object={branch} />
      </group>
    </>
  );
}

