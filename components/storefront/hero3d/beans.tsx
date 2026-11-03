"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { GRINDER_HOPPER_Y } from "./constants";
import { createBeanGeometry, createCherryGeometry, createLeafGeometry } from "./geometries";
import { lerp, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";
import { makeLeafTexture } from "./textures";

type P = { progress: MotionValue<number> };

const BEAN_LEN = 0.25; // ~1.2 cm reales
const CHERRY_R = 0.17; // ~1.7 cm de diámetro
const LEAF_LEN = 1.05; // ~5 cm: una hoja joven

/**
 * Estación 1 — del árbol a la taza: ramita de café colombiano con cerezas rojas
 * y hojas, junto a los granos tostados que luego caen al molino.
 */
export function BeansStation({ progress }: P) {
  const { beans } = useQuality();
  const beanRef = useRef<THREE.InstancedMesh>(null);
  const cherryRef = useRef<THREE.InstancedMesh>(null);
  const leafRefs = useRef<(THREE.Mesh | null)[]>([]);

  const beanGeo = useMemo(() => createBeanGeometry(), []);
  const cherryGeo = useMemo(() => createCherryGeometry(), []);
  const leafGeo = useMemo(() => createLeafGeometry(), []);
  const beanMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.5, envMapIntensity: 0.6 }),
    [],
  );
  const cherryMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }),
    [],
  );
  const leafMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: makeLeafTexture(),
        roughness: 0.4,
        clearcoat: 0.5,
        clearcoatRoughness: 0.35,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const beanItems = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: beans }, () => {
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      const r = Math.cbrt(rnd()) * 1.45;
      return {
        home: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.72, r * Math.sin(phi) * Math.sin(theta)),
        target: new THREE.Vector3((rnd() - 0.5) * 0.45, GRINDER_HOPPER_Y + 0.3, (rnd() - 0.5) * 0.45),
        scale: BEAN_LEN * (0.9 + rnd() * 0.2),
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: (rnd() - 0.5) * 0.7,
        phase: rnd() * 6.28,
        delay: rnd(),
        sway: (rnd() - 0.5) * 1.0,
        shade: rnd(),
      };
    });
  }, [beans]);

  // Cerezas: racimos en el lado izquierdo del cluster, cerca de las hojas.
  const cherryItems = useMemo(() => {
    const rnd = mulberry32(55);
    const colors = ["#b3122b", "#c0162f", "#a50f26", "#d98a1b", "#c8102e", "#8e0b20"];
    return Array.from({ length: 11 }, (_, i) => ({
      pos: new THREE.Vector3(0.1 + (rnd() - 0.5) * 1.6, 0.9 - rnd() * 1.9 + (i % 3) * 0.1, (rnd() - 0.2) * 1.5),
      scale: CHERRY_R * (0.85 + rnd() * 0.3),
      phase: rnd() * 6.28,
      color: colors[Math.floor(rnd() * colors.length)],
    }));
  }, []);

  const leafItems = useMemo(
    () => [
      { pos: [-0.9, 1.0, 0.4], rot: [0.5, 0.9, 0.3], s: 1.0 },
      { pos: [0.7, 1.25, -0.6], rot: [0.2, -1.2, -0.2], s: 0.9 },
      { pos: [-0.2, -1.0, 0.9], rot: [-0.4, 2.2, 0.5], s: 1.0 },
      { pos: [0.9, -0.7, -0.4], rot: [0.6, -0.4, 0.2], s: 0.85 },
      { pos: [-1.1, -0.2, -0.6], rot: [-0.2, 1.6, -0.3], s: 0.8 },
    ],
    [],
  );

  useLayoutEffect(() => {
    const c = new THREE.Color();
    const b = beanRef.current;
    if (b) {
      beanItems.forEach((it, i) => {
        c.setHSL(0.055, 0.55, 0.07 + it.shade * 0.09, THREE.SRGBColorSpace);
        b.setColorAt(i, c);
      });
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
    const ch = cherryRef.current;
    if (ch) {
      cherryItems.forEach((it, i) => ch.setColorAt(i, c.set(it.color)));
      if (ch.instanceColor) ch.instanceColor.needsUpdate = true;
    }
  }, [beanItems, cherryItems]);

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const b = beanRef.current;
    const ch = cherryRef.current;
    if (!b || !ch) return;

    const showBeans = p < 0.36;
    b.visible = showBeans;
    if (showBeans) {
      beanItems.forEach((it, i) => {
        const e = smoothstep(0.1 + it.delay * 0.1, 0.22 + it.delay * 0.1, p);
        dummy.position.set(
          lerp(it.home.x, it.target.x, e) + Math.sin(e * Math.PI) * it.sway,
          lerp(it.home.y + Math.sin(t * 0.7 + it.phase) * 0.07, it.target.y, e),
          lerp(it.home.z, it.target.z, e),
        );
        dummy.rotation.set(it.rot.x + t * it.spin + e * 4, it.rot.y + t * it.spin * 0.7, it.rot.z);
        dummy.scale.setScalar(Math.max(it.scale * (1 - smoothstep(0.9, 1, e)), 0.0001));
        dummy.updateMatrix();
        b.setMatrixAt(i, dummy.matrix);
      });
      b.instanceMatrix.needsUpdate = true;
    }

    // Cerezas y hojas: se quedan atrás (suben y se encogen) cuando empieza la molienda.
    const fade = 1 - smoothstep(0.08, 0.2, p);
    ch.visible = fade > 0.01;
    if (ch.visible) {
      cherryItems.forEach((it, i) => {
        dummy.position.set(it.pos.x, it.pos.y + Math.sin(t * 0.6 + it.phase) * 0.06 + (1 - fade) * 1.5, it.pos.z);
        dummy.rotation.set(0, t * 0.15 + it.phase, 0);
        dummy.scale.setScalar(Math.max(it.scale * fade, 0.0001));
        dummy.updateMatrix();
        ch.setMatrixAt(i, dummy.matrix);
      });
      ch.instanceMatrix.needsUpdate = true;
    }
    leafRefs.current.forEach((m, i) => {
      if (!m) return;
      m.visible = fade > 0.01;
      const it = leafItems[i];
      m.position.set(it.pos[0], it.pos[1] + Math.sin(t * 0.5 + i) * 0.05 + (1 - fade) * 1.5, it.pos[2]);
      m.rotation.set(it.rot[0] + Math.sin(t * 0.4 + i) * 0.05, it.rot[1] + t * 0.05, it.rot[2]);
      m.scale.setScalar(LEAF_LEN * it.s * Math.max(fade, 0.0001));
    });
  });

  return (
    <>
      <instancedMesh ref={beanRef} args={[beanGeo, beanMat, beans]} frustumCulled={false} />
      <instancedMesh ref={cherryRef} args={[cherryGeo, cherryMat, cherryItems.length]} frustumCulled={false} />
      {leafItems.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            leafRefs.current[i] = el;
          }}
          geometry={leafGeo}
          material={leafMat}
        />
      ))}
    </>
  );
}
