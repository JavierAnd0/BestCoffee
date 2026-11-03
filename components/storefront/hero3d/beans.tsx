"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { GRINDER_PILE_Y, SACK_SCALE } from "./constants";
import {
  createBeanGeometry,
  createCherryGeometry,
  createLeafGeometry,
  createSackGeometry,
} from "./geometries";
import { clamp01, lerp, mulberry32, smoothstep } from "./math";
import { makeBeanMaterial } from "./materials";
import { useQuality } from "./quality";
import { sackCenter, sackMouth, sackTilt } from "./sack";
import {
  makeBurlapTexture,
  makeLeafTexture,
  makeSackLogoTexture,
} from "./textures";

type P = { progress: MotionValue<number> };

const BEAN_LEN = 0.25; // ~1.2 cm reales
const CHERRY_R = 0.17;
const LEAF_LEN = 1.0;
const FLIGHT = 0.03; // duración del vuelo de un grano (en unidades de scroll)

/**
 * ESTACIÓN 1 — del costal al molino.
 * El costal de fique se levanta, se inclina y vierte los granos en un hilo sobre la tolva;
 * allí se apilan y luego se consumen al moler. Una ramita de café (cerezas y hojas) acompaña
 * el primer plano y se aparta cuando empieza la caída.
 */
export function BeansStation({ progress }: P) {
  const { beans } = useQuality();
  const beanRef = useRef<THREE.InstancedMesh>(null);
  const cherryRef = useRef<THREE.InstancedMesh>(null);
  const sackRef = useRef<THREE.Group>(null);
  const branchRef = useRef<THREE.Group>(null);

  const beanGeo = useMemo(() => createBeanGeometry(), []);
  const cherryGeo = useMemo(() => createCherryGeometry(), []);
  const leafGeo = useMemo(() => createLeafGeometry(), []);
  const sackGeo = useMemo(() => createSackGeometry(), []);

  const beanMat = useMemo(() => makeBeanMaterial(), []);
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
  const burlap = useMemo(() => {
    const map = makeBurlapTexture();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(3, 2);
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: map,
      bumpScale: 1.6,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }, []);
  const logoMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: makeSackLogoTexture(),
        transparent: true,
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        depthWrite: false,
      }),
    [],
  );
  const twig = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a3a1e", roughness: 0.8 }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);

  /**
   * Cada grano: dónde descansa en el costal, cuándo sale (te), de dónde parte, dónde cae en la
   * tolva y cuándo lo consume el molino. Los de arriba salen primero.
   */
  const items = useMemo(() => {
    const rnd = mulberry32(21);
    const raw = Array.from({ length: beans }, () => {
      const r = Math.sqrt(rnd()) * 0.62;
      const a = rnd() * Math.PI * 2;
      const height = 1.38 + (1 - (r / 0.62) ** 2) * 0.3 + rnd() * 0.08;
      return { r, a, height, rnd: rnd() };
    });
    raw.sort((u, v) => v.height - u.height);
    const start = new THREE.Vector3();
    return raw.map((b, i) => {
      const te = 0.175 + (i / beans) * 0.115 + (rnd() - 0.5) * 0.004;
      sackMouth(te, start);
      const jr = Math.sqrt(rnd()) * 0.26;
      const ja = rnd() * Math.PI * 2;
      const pr = Math.sqrt(rnd()) * 0.34;
      const pa = rnd() * Math.PI * 2;
      return {
        local: new THREE.Vector3(Math.cos(b.a) * b.r, b.height, Math.sin(b.a) * b.r * 0.62),
        te,
        from: new THREE.Vector3(start.x + Math.cos(ja) * jr, start.y - 0.12, start.z + Math.sin(ja) * jr),
        to: new THREE.Vector3(
          Math.cos(pa) * pr,
          GRINDER_PILE_Y + (1 - (pr / 0.34) ** 2) * 0.17 + rnd() * 0.05,
          Math.sin(pa) * pr,
        ),
        scale: BEAN_LEN * (0.88 + rnd() * 0.24),
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: new THREE.Vector3((rnd() - 0.5) * 9, (rnd() - 0.5) * 9, (rnd() - 0.5) * 9),
        sway: (rnd() - 0.5) * 0.18,
        eat: 0.34 + rnd() * 0.12, // cuándo lo muele el molino
        shade: 0.78 + rnd() * 0.4,
      };
    });
  }, [beans]);

  const cherries = useMemo(() => {
    const rnd = mulberry32(55);
    const cols = ["#b3122b", "#c0162f", "#a50f26", "#d98a1b", "#c8102e", "#8e0b20"];
    return Array.from({ length: 12 }, (_, i) => ({
      pos: new THREE.Vector3(0.95 + rnd() * 0.5, 0.2 + rnd() * 1.1, -(1.0 + (i % 4) * 0.3 + rnd() * 0.3)),
      scale: CHERRY_R * (0.85 + rnd() * 0.3),
      phase: rnd() * 6.28,
      color: cols[Math.floor(rnd() * cols.length)],
    }));
  }, []);
  const leaves = useMemo(
    () => [
      { pos: [1.2, 0.35, -1.0], rot: [0.5, 3.0, 0.9], s: 1.0 },
      { pos: [1.15, 1.0, -1.55], rot: [-0.3, 4.1, 0.6], s: 0.95 },
      { pos: [1.0, 0.1, -2.1], rot: [0.4, 2.5, 0.2], s: 0.85 },
      { pos: [1.3, 1.25, -1.0], rot: [0.1, 3.7, 1.1], s: 0.9 },
    ],
    [],
  );
  const branchCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.2, -0.5, -2.5),
        new THREE.Vector3(1.1, 0.2, -1.7),
        new THREE.Vector3(1.05, 0.8, -1.2),
        new THREE.Vector3(1.0, 1.3, -0.9),
      ]),
    [],
  );
  const branchGeo = useMemo(() => new THREE.TubeGeometry(branchCurve, 20, 0.035, 6), [branchCurve]);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    const b = beanRef.current;
    if (b) {
      items.forEach((it, i) => b.setColorAt(i, c.setRGB(it.shade, it.shade * 0.96, it.shade * 0.92)));
      if (b.instanceColor) b.instanceColor.needsUpdate = true;
    }
    const ch = cherryRef.current;
    if (ch) {
      cherries.forEach((it, i) => ch.setColorAt(i, c.set(it.color)));
      if (ch.instanceColor) ch.instanceColor.needsUpdate = true;
    }
  }, [items, cherries]);

  useFrame(({ clock }) => {
    const p = progress.get();
    const t = clock.elapsedTime;
    const b = beanRef.current;
    const ch = cherryRef.current;
    const sack = sackRef.current;
    if (!b || !ch || !sack) return;

    // ── Costal ──
    sackCenter(p, tmpA);
    sack.position.copy(tmpA);
    sack.rotation.set(sackTilt(p), 0, 0);
    sack.visible = p < 0.42;
    sack.updateMatrixWorld(true);

    // ── Granos ──
    const show = p < 0.55;
    b.visible = show;
    if (show) {
      items.forEach((it, i) => {
        const f = clamp01((p - it.te) / FLIGHT);
        let sc = it.scale;
        if (p < it.te) {
          // todavía dentro del costal: se mueve con él
          tmpB.copy(it.local).applyMatrix4(sack.matrixWorld);
          dummy.rotation.copy(it.rot);
        } else if (f < 1) {
          // caída libre: acelera, gira y se desvía un poco
          const fy = Math.pow(f, 1.7);
          tmpB.set(
            lerp(it.from.x, it.to.x, f) + Math.sin(f * Math.PI) * it.sway,
            lerp(it.from.y, it.to.y, fy),
            lerp(it.from.z, it.to.z, f),
          );
          dummy.rotation.set(it.rot.x + it.spin.x * f, it.rot.y + it.spin.y * f, it.rot.z + it.spin.z * f);
        } else {
          // apilado en la tolva; el molino lo va consumiendo
          const eaten = smoothstep(it.eat, it.eat + 0.06, p);
          tmpB.copy(it.to);
          tmpB.y -= eaten * 0.25;
          sc *= 1 - eaten;
          dummy.rotation.set(it.rot.x + it.spin.x, it.rot.y + it.spin.y, it.rot.z + it.spin.z);
        }
        dummy.position.copy(tmpB);
        dummy.scale.setScalar(Math.max(sc, 0.0001));
        dummy.updateMatrix();
        b.setMatrixAt(i, dummy.matrix);
      });
      b.instanceMatrix.needsUpdate = true;
    }

    // ── Ramita de café: se aparta al empezar la caída ──
    const fade = 1 - smoothstep(0.09, 0.17, p);
    const br = branchRef.current;
    if (br) {
      br.visible = fade > 0.01;
      br.position.y = (1 - fade) * 1.2;
      br.scale.setScalar(Math.max(fade, 0.0001));
    }
    ch.visible = fade > 0.01;
    if (ch.visible) {
      cherries.forEach((it, i) => {
        dummy.position.set(
          it.pos.x,
          it.pos.y + Math.sin(t * 0.6 + it.phase) * 0.03 + (1 - fade) * 1.2,
          it.pos.z,
        );
        dummy.rotation.set(0, t * 0.12 + it.phase, 0);
        dummy.scale.setScalar(Math.max(it.scale * fade, 0.0001));
        dummy.updateMatrix();
        ch.setMatrixAt(i, dummy.matrix);
      });
      ch.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={sackRef}>
        <group scale={[SACK_SCALE.x, SACK_SCALE.y, SACK_SCALE.z]}>
          <mesh geometry={sackGeo} material={burlap} />
          {/* Sello impreso (mismo aplastamiento que el costal) */}
          <mesh position={[0, 0.05, 0]} scale={[1, 1, 0.64]} material={logoMat}>
            <cylinderGeometry args={[0.96, 0.96, 1.05, 24, 1, true, Math.PI / 2 - 0.62, 1.24]} />
          </mesh>
          {/* Borde enrollado (el costal está abierto y doblado hacia afuera) */}
          <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.64, 1]} material={burlap}>
            <torusGeometry args={[0.7, 0.11, 10, 40]} />
          </mesh>
        </group>
      </group>

      <group ref={branchRef}>
        <mesh geometry={branchGeo} material={twig} />
        {leaves.map((l, i) => (
          <mesh
            key={i}
            geometry={leafGeo}
            material={leafMat}
            position={l.pos as [number, number, number]}
            rotation={l.rot as [number, number, number]}
            scale={LEAF_LEN * l.s}
          />
        ))}
      </group>

      <instancedMesh ref={cherryRef} args={[cherryGeo, cherryMat, cherries.length]} frustumCulled={false} />
      <instancedMesh ref={beanRef} args={[beanGeo, beanMat, beans]} frustumCulled={false} />
    </>
  );
}

