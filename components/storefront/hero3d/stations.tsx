"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  CUP_BASE_Y,
  CUP_HEIGHT,
  GRINDER_HALF_H,
  GRINDER_HOPPER_Y,
  GRINDER_OUTLET_Y,
  LIQUID_MAX,
  LIQUID_MIN,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
  MOKA_FUNNEL_RIM,
  MOKA_YAW,
  POUR_TARGET,
  POUR_TILT,
  STATION_Y,
} from "./constants";
import {
  createBeanGeometry,
  createCupGeometry,
  createCupHandleGeometry,
  createGrinderBodyGeometry,
  createGrinderHopperGeometry,
  createMokaBoilerGeometry,
  createMokaFunnelGeometry,
  createMokaHandleGeometry,
  createMokaLidGeometry,
  createMokaSpoutGeometry,
  createMokaUpperGeometry,
  createSaucerGeometry,
} from "./geometries";
import { lerp, mulberry32, smoothstep } from "./math";
import { useQuality } from "./quality";
import {
  makeCremaTexture,
  makeDotTexture,
  makeShadowTexture,
  makeSoftTexture,
  makeWoodTexture,
} from "./textures";

type P = { progress: MotionValue<number> };

/* ═══════════════════════════ ESTACIÓN 1 · GRANOS ═══════════════════════════ */

export function BeansStation({ progress }: P) {
  const { beans } = useQuality();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createBeanGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.45,
        clearcoat: 0.3,
        clearcoatRoughness: 0.45,
      }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cada grano tiene su "casa" en el racimo, su retraso para caer y su giro.
  const items = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: beans }, () => {
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      const r = Math.cbrt(rnd()) * 1.55;
      return {
        home: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.75,
          r * Math.sin(phi) * Math.sin(theta),
        ),
        target: new THREE.Vector3(
          (rnd() - 0.5) * 0.5,
          GRINDER_HOPPER_Y + 0.35,
          (rnd() - 0.5) * 0.5,
        ),
        scale: 0.15 + rnd() * 0.06,
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: (rnd() - 0.5) * 0.8,
        phase: rnd() * 6.28,
        delay: rnd(),
        sway: (rnd() - 0.5) * 1.2,
        shade: rnd(),
      };
    });
  }, [beans]);

  // Variación de tono por grano (un solo material para todos: instancing).
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    items.forEach((it, i) => {
      c.setHSL(0.06, 0.6, 0.06 + it.shade * 0.07);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const p = progress.get();
    m.visible = p < 0.36;
    if (!m.visible) return;
    const t = clock.elapsedTime;

    items.forEach((it, i) => {
      // e: 0 = flotando en el racimo, 1 = dentro de la tolva
      const e = smoothstep(0.1 + it.delay * 0.1, 0.22 + it.delay * 0.1, p);
      dummy.position.set(
        lerp(it.home.x, it.target.x, e) + Math.sin(e * Math.PI) * it.sway,
        lerp(it.home.y + Math.sin(t * 0.7 + it.phase) * 0.07, it.target.y, e),
        lerp(it.home.z, it.target.z, e),
      );
      dummy.rotation.set(it.rot.x + t * it.spin + e * 4, it.rot.y + t * it.spin * 0.7, it.rot.z);
      dummy.scale.setScalar(Math.max(it.scale * (1 - smoothstep(0.9, 1, e)), 0.0001));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, beans]} frustumCulled={false} />;
}

/* ═══════════════════════════ ESTACIÓN 2 · MOLINO ═══════════════════════════ */

export function GrinderStation({ progress }: P) {
  const { segments } = useQuality();
  const crank = useRef<THREE.Group>(null);
  const body = useMemo(() => createGrinderBodyGeometry(segments), [segments]);
  const hopper = useMemo(() => createGrinderHopperGeometry(segments), [segments]);
  const wood = useMemo(() => {
    const map = makeWoodTexture();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(3, 1);
    return new THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0.05 });
  }, []);
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c89a4a", metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
    [],
  );
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#bfc3c8", metalness: 1, roughness: 0.25 }),
    [],
  );

  useFrame(() => {
    if (crank.current) {
      // La manivela gira mientras muele (estación 2).
      crank.current.rotation.y = smoothstep(0.2, 0.5, progress.get()) * 26;
    }
  });

  return (
    <group position={[0, STATION_Y.GRINDER, 0]}>
      <mesh geometry={body} material={wood} />
      <mesh geometry={hopper} material={brass} />
      <mesh position={[0, -GRINDER_HALF_H, 0]} material={brass}>
        <cylinderGeometry args={[0.25, 0.22, 0.14, segments]} />
      </mesh>
      {/* Manivela: eje vertical + brazo horizontal + perilla de madera */}
      <group ref={crank}>
        <mesh position={[0, 1.2, 0]} material={steel}>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 16]} />
        </mesh>
        <mesh position={[0.5, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} material={steel}>
          <cylinderGeometry args={[0.045, 0.045, 1.0, 16]} />
        </mesh>
        <mesh position={[1.0, 1.98, 0]} material={wood}>
          <capsuleGeometry args={[0.1, 0.24, 6, 14]} />
        </mesh>
        <mesh position={[0, 1.82, 0]} material={brass}>
          <sphereGeometry args={[0.09, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/* ═══════════ CAFÉ MOLIDO cayendo del molino al filtro de la moka ═══════════ */

export function GroundsFlow({ progress }: P) {
  const { grounds } = useQuality();
  const ref = useRef<THREE.Points>(null);
  const dot = useMemo(() => makeDotTexture(), []);
  const seeds = useMemo(() => {
    const rnd = mulberry32(33);
    return Array.from({ length: grounds }, () => ({
      phase: rnd(),
      speed: 0.7 + rnd() * 0.6,
      dx: (rnd() - 0.5) * 0.3,
      dz: (rnd() - 0.5) * 0.3,
    }));
  }, [grounds]);
  const positions = useMemo(() => new Float32Array(grounds * 3), [grounds]);

  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const p = progress.get();
    const active = smoothstep(0.22, 0.28, p) * (1 - smoothstep(0.47, 0.5, p));
    pts.visible = active > 0.01;
    if (!pts.visible) return;
    (pts.material as THREE.PointsMaterial).opacity = active;

    const t = clock.elapsedTime;
    const mokaY = lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p));
    const floorY = mokaY + MOKA_FUNNEL_RIM + 0.15;
    const fall = GRINDER_OUTLET_Y - floorY;
    seeds.forEach((s, i) => {
      const life = (t * 0.55 * s.speed + s.phase) % 1;
      positions[i * 3] = s.dx * life;
      positions[i * 3 + 1] = GRINDER_OUTLET_Y - fall * life * life; // cae acelerando
      positions[i * 3 + 2] = s.dz * life;
    });
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#3a1d0e"
        size={0.06}
        map={dot}
        alphaTest={0.4}
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════ VAPOR (sprites con opacidad individual) ═══════════════════ */

interface SteamProps {
  count: number;
  /** Devuelve la intensidad (0–1) y escribe en `out` el punto de origen en el mundo. */
  state: (out: THREE.Vector3) => number;
  size?: number;
  rise?: number;
  spread?: number;
}

export function Steam({ count, state, size = 0.5, rise = 1.5, spread = 0.18 }: SteamProps) {
  const group = useRef<THREE.Group>(null);
  const map = useMemo(() => makeSoftTexture(), []);
  const sprites = useMemo(() => {
    const rnd = mulberry32(77);
    return Array.from({ length: count }, () => {
      const mat = new THREE.SpriteMaterial({
        map,
        color: "#d9c7b3",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      return { sprite: new THREE.Sprite(mat), phase: rnd(), wob: rnd() * 6.28 };
    });
  }, [count, map]);
  const origin = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const amount = state(origin);
    const g = group.current;
    if (g) g.visible = amount > 0.01;
    if (amount <= 0.01) return;
    const t = clock.elapsedTime;
    sprites.forEach((s) => {
      const life = (t * 0.22 + s.phase) % 1;
      s.sprite.position.set(
        origin.x + Math.sin(t * 0.9 + s.wob) * spread * life,
        origin.y + life * rise,
        origin.z + Math.cos(t * 0.7 + s.wob) * spread * life,
      );
      s.sprite.scale.setScalar(size * (0.55 + life * 1.5));
      (s.sprite.material as THREE.SpriteMaterial).opacity = amount * Math.sin(life * Math.PI) * 0.42;
    });
  });

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s.sprite} />
      ))}
    </group>
  );
}

/* ═══════════════════════ ESTACIÓN 3 · MOKA + SERVIR ═══════════════════════ */

/** Altura del líquido dentro de la taza (nivel local) según el progreso. */
export function liquidLevel(p: number) {
  return lerp(LIQUID_MIN, LIQUID_MAX * 0.88, smoothstep(0.78, 0.92, p));
}

export function MokaStation({ progress }: P) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const mound = useRef<THREE.Mesh>(null);
  const spout = useRef<THREE.Object3D>(null);
  const stream = useRef<THREE.Mesh>(null);

  const geo = useMemo(
    () => ({
      boiler: createMokaBoilerGeometry(),
      funnel: createMokaFunnelGeometry(),
      upper: createMokaUpperGeometry(),
      lid: createMokaLidGeometry(),
      handle: createMokaHandleGeometry(),
      spout: createMokaSpoutGeometry(),
    }),
    [],
  );
  const metal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8dbdf",
        metalness: 1,
        roughness: 0.3,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const bakelite = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#161111", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    [],
  );
  const coffee = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b1509", roughness: 0.95 }), []);
  const liquid = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a1208", roughness: 0.12, metalness: 0.1 }),
    [],
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const base = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const r = root.current;
    const tl = tilt.current;
    const up = upper.current;
    if (!r || !tl || !up || !spout.current) return;
    const p = progress.get();
    const t = clock.elapsedTime;

    // 1) Dosificación → armada: la caldera baja a su estación.
    base.set(0, lerp(MOKA_DOSING_Y, MOKA_ASSEMBLED_Y, smoothstep(0.5, 0.57, p)), 0);

    // 2) Servir: se inclina y su pico se coloca justo sobre la taza.
    const pourIn = smoothstep(0.72, 0.8, p);
    const pour = pourIn * (1 - smoothstep(0.9, 0.95, p));
    tl.rotation.z = -POUR_TILT * pour;
    r.rotation.set(0, MOKA_YAW, 0);
    r.position.copy(base);
    // pequeño temblor mientras hierve
    const brewing = smoothstep(0.58, 0.64, p) * (1 - pourIn);
    r.position.x += Math.sin(t * 38) * 0.004 * brewing;

    r.updateMatrixWorld(true);
    spout.current.getWorldPosition(tmp);
    const offX = tmp.x - r.position.x;
    const offY = tmp.y - r.position.y;
    const offZ = tmp.z - r.position.z;
    r.position.set(
      lerp(base.x, POUR_TARGET.x - offX, pour),
      lerp(base.y, POUR_TARGET.y - offY, pour),
      lerp(base.z, POUR_TARGET.z - offZ, pour),
    );
    r.updateMatrixWorld(true);

    // 3) La cámara superior llega desde un costado y se asienta sobre la caldera.
    const e = smoothstep(0.49, 0.58, p);
    up.visible = p > 0.47;
    up.position.set(lerp(2.6, 0, e), lerp(2.0, 0.95, e) + Math.sin(e * Math.PI) * 0.5, 0);
    up.rotation.z = (1 - e) * -0.5;

    // 4) El café molido va llenando el filtro mientras muele.
    if (mound.current) {
      const dose = smoothstep(0.26, 0.46, p);
      mound.current.scale.set(1, Math.max(dose, 0.001), 1);
      mound.current.visible = dose > 0.01;
    }

    // 5) Chorro: de la punta del pico a la superficie del café en la taza.
    if (stream.current) {
      spout.current.getWorldPosition(tmp);
      const surface = CUP_BASE_Y + 0.06 + liquidLevel(p);
      const amt = smoothstep(0.77, 0.79, p) * (1 - smoothstep(0.9, 0.92, p));
      const len = Math.max(tmp.y - surface, 0.001);
      stream.current.visible = amt > 0.01 && len > 0.02;
      stream.current.position.set(tmp.x, surface + len / 2, tmp.z);
      stream.current.scale.set(amt * (0.9 + Math.sin(t * 24) * 0.08), len, amt * (0.9 + Math.sin(t * 24) * 0.08));
    }
  });

  return (
    <>
      <group ref={root}>
        <group ref={tilt}>
          <mesh geometry={geo.boiler} material={metal} />
          <mesh geometry={geo.funnel} material={metal} />
          <mesh ref={mound} position={[0, MOKA_FUNNEL_RIM - 0.08, 0]} material={coffee}>
            <coneGeometry args={[0.48, 0.34, 16]} />
          </mesh>
          <group ref={upper}>
            <mesh geometry={geo.upper} material={metal} />
            <mesh geometry={geo.lid} position={[0, 1.1, 0]} material={metal} />
            <mesh position={[0, 1.32, 0]} material={bakelite}>
              <sphereGeometry args={[0.1, 16, 12]} />
            </mesh>
            <mesh geometry={geo.handle} material={bakelite} />
            <mesh geometry={geo.spout} position={[0.79, 1.03, 0]} material={metal} />
          </group>
          {/* Marca invisible donde cae el café (punta del pico) */}
          <object3D ref={spout} position={[1.0, 1.95, 0]} />
        </group>
      </group>
      <mesh ref={stream} material={liquid} visible={false}>
        <cylinderGeometry args={[0.045, 0.045, 1, 10, 1, true]} />
      </mesh>
    </>
  );
}

/* ═══════════════════════════ ESTACIÓN 4 · TAZA ═══════════════════════════ */

export function CupStation({ progress }: P) {
  const { segments, steam } = useQuality();
  const liquidMesh = useRef<THREE.Mesh>(null);
  const cup = useMemo(() => createCupGeometry(segments), [segments]);
  const saucer = useMemo(() => createSaucerGeometry(segments), [segments]);
  const handle = useMemo(() => createCupHandleGeometry(), []);
  const glaze = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#b9582f",
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
    [],
  );
  const crema = useMemo(
    () => new THREE.MeshStandardMaterial({ map: makeCremaTexture(), roughness: 0.25, metalness: 0.05 }),
    [],
  );
  const shadowTex = useMemo(() => makeShadowTexture(), []);

  useFrame(() => {
    const m = liquidMesh.current;
    if (!m) return;
    const level = liquidLevel(progress.get());
    const filled = progress.get() > 0.775;
    m.visible = filled;
    // radio interior de la taza a esa altura
    const r = 0.43 + Math.max(0, (level - 0.24) / 1.1) * 0.2;
    m.position.y = 0.06 + level;
    m.scale.set(r - 0.012, r - 0.012, 1);
  });

  const steamState = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      out.set(0, CUP_BASE_Y + 0.06 + CUP_HEIGHT + 0.05, 0);
      return smoothstep(0.84, 0.95, p);
    },
    [progress],
  );

  return (
    <>
      <group position={[0, CUP_BASE_Y, 0]}>
        {/* Sombra suave de contacto (barata: un plano con degradado) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[4.2, 4.2]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>
        <mesh geometry={saucer} material={glaze} />
        <group position={[0, 0.06, 0]} rotation={[0, Math.PI / 4, 0]}>
          <mesh geometry={cup} material={glaze} />
          <mesh geometry={handle} material={glaze} position={[0.66, 0.78, 0]} rotation={[0, 0, -Math.PI / 2]} />
        </group>
        <mesh ref={liquidMesh} rotation={[-Math.PI / 2, 0, 0]} material={crema} visible={false}>
          <circleGeometry args={[1, segments]} />
        </mesh>
      </group>
      <Steam count={steam} state={steamState} size={0.55} rise={1.5} spread={0.22} />
    </>
  );
}

/* Vapor del moka mientras hierve (entre armado y servir). */
export function MokaSteam({ progress }: P) {
  const { steam } = useQuality();
  const state = useMemo(
    () => (out: THREE.Vector3) => {
      const p = progress.get();
      out.set(0, MOKA_ASSEMBLED_Y + 2.45, 0);
      return smoothstep(0.6, 0.66, p) * (1 - smoothstep(0.72, 0.76, p)) * 0.8;
    },
    [progress],
  );
  return <Steam count={Math.round(steam * 0.6)} state={state} size={0.38} rise={1.1} spread={0.12} />;
}
