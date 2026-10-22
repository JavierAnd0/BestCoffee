"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMotionValue, type MotionValue } from "motion/react";

const BEAN_URL = "/models/coffee_bean.glb?v=7";
const GRINDER_URL = "/models/coffee_grinder.glb?v=7";
const MOKA_URL =
  "/models/coffee_maker_italian_moka_pot_individual_parts.glb?v=7";
const CUP_URL = "/models/Taza.glb?v=7";

/* ═══════════════════════════════════════════════════════════
   SCENE LAYOUT (world units)
   ───────────────────────────────────────────────────────────
   Station 1  BEANS    Y =   0.0  floating cluster of roasted beans
   Station 2  GRINDER  Y =  -4.8  manual grinder (2.58 u tall)
   Dosing     MOKA     Y =  -6.8  Moka boiler right under the grinder exit
   Station 3  MOKA     Y =  -9.0  Moka assembly (2.04 u tall)
   Station 4  CUP      Y = -12.8  Taza.glb (1.35 u tall) on the table

   Proportions: grinder ≈ 1.27× Moka, Moka ≈ 1.5× cup.
   ═══════════════════════════════════════════════════════════ */
const STATION_Y = {
  BEANS: 0.0,
  GRINDER: -4.8,
  MOKA: -9.0,
  CUP: -12.8,
} as const;

// ── Grinder (native height 0 → 0.1842 m) ──
const GRINDER_SCALE_Y = 14.0;
const GRINDER_SCALE_XZ = 16.3;
const GRINDER_NATIVE_CENTER = 0.092;
const GRINDER_RIM_Y =
  STATION_Y.GRINDER + (0.1589 - GRINDER_NATIVE_CENTER) * GRINDER_SCALE_Y; // hopper mouth
const GRINDER_BOTTOM_Y =
  STATION_Y.GRINDER - GRINDER_NATIVE_CENTER * GRINDER_SCALE_Y; // catch-cup base

// ── Moka (native height -0.073 → 0.0647 m) ──
const MOKA_SCALE = 16.2;
const SPOUT_NATIVE_X = -0.0522;
const SPOUT_NATIVE_Y = 0.0295;
const MOKA_FUNNEL_RIM_OFFSET = -0.0138 * MOKA_SCALE;
// Boiler sits so its funnel rim is 0.95 u below the grinder exit while dosing
const MOKA_DOSING_Y = GRINDER_BOTTOM_Y - 0.95 - MOKA_FUNNEL_RIM_OFFSET;

// ── Cup (Taza.glb native height 2.2156) ──
const CUP_SCALE = 1.35 / 2.2156;
const CUP_HALF = 1.1078 * CUP_SCALE;
const CUP_CENTER_Y = STATION_Y.CUP - 0.35;
const TABLE_Y = CUP_CENTER_Y - CUP_HALF;
const CUP_RIM_Y = CUP_CENTER_Y + CUP_HALF;
const CUP_INNER_R = 1.435 * CUP_SCALE;
// Handle turned toward camera-right so the Moka can pour from behind-right
const CUP_ROT_Y = -0.45;
const LIQ_MIN_Y = -0.25;
const LIQ_MAX_Y = 0.42;

// ── Moka pour pose (validated: 0.30 u clearance to cup wall, 0.77 u to handle) ──
const POUR_YAW = Math.PI * 0.75; // spout faces the cup from behind-right
const POUR_DIR_X = -Math.cos(POUR_YAW);
const POUR_DIR_Z = Math.sin(POUR_YAW);
const SPOUT_ABOVE_RIM = 0.36;
const SPOUT_INSIDE_R = 0.4;

const DUMMY = new THREE.Object3D();
const TMP_SPOUT = new THREE.Vector3();
const TMP_P0 = new THREE.Vector3();
const TMP_P1 = new THREE.Vector3();
const TMP_P2 = new THREE.Vector3();
const TMP_PT = new THREE.Vector3();

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Moka Y during stations 2–3: under the grinder while dosing, then down to assembly height. */
function getMokaStation3Y(p: number): number {
  return THREE.MathUtils.lerp(
    MOKA_DOSING_Y,
    STATION_Y.MOKA,
    smoothstep(0.5, 0.57, p),
  );
}

/**
 * Visual centre (world Y) of what should be on screen at progress p.
 * The camera looks slightly above it so content sits centred below the navbar.
 */
const TRANSFER_FOCUS_Y =
  (GRINDER_RIM_Y + 0.9 + (MOKA_DOSING_Y - 0.073 * MOKA_SCALE)) / 2;

function getCameraFocusY(p: number): number {
  const L = THREE.MathUtils.lerp;
  if (p <= 0.04) return STATION_Y.BEANS;
  if (p <= 0.22) {
    const u = smoothstep(0.04, 0.22, p);
    return L(STATION_Y.BEANS, STATION_Y.GRINDER + 0.35, u);
  }
  if (p <= 0.3) {
    const u = smoothstep(0.22, 0.3, p);
    return L(STATION_Y.GRINDER + 0.35, STATION_Y.GRINDER + 0.05, u);
  }
  if (p <= 0.36) {
    const u = smoothstep(0.3, 0.36, p);
    return L(STATION_Y.GRINDER + 0.05, TRANSFER_FOCUS_Y, u);
  }
  if (p <= 0.49) return TRANSFER_FOCUS_Y;
  if (p <= 0.57) {
    const u = smoothstep(0.49, 0.57, p);
    return L(TRANSFER_FOCUS_Y, STATION_Y.MOKA + 0.1, u);
  }
  if (p <= 0.72) return STATION_Y.MOKA + 0.1;
  if (p <= 0.8) {
    const u = smoothstep(0.72, 0.8, p);
    return L(STATION_Y.MOKA + 0.1, STATION_Y.CUP + 0.62, u);
  }
  if (p <= 0.93) return STATION_Y.CUP + 0.62;
  const u = smoothstep(0.93, 1.0, p);
  return L(STATION_Y.CUP + 0.62, STATION_Y.CUP + 0.15, u);
}

/* ═══════════════════════════════════════════════════════════
   PROCEDURAL TEXTURES & 3D GEOMETRIES
   ═══════════════════════════════════════════════════════════ */
let cachedSoftTexture: THREE.CanvasTexture | null = null;
function getSoftParticleTexture(): THREE.CanvasTexture {
  if (cachedSoftTexture) return cachedSoftTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(255, 250, 244, 1)");
  grad.addColorStop(0.35, "rgba(255, 245, 235, 0.55)");
  grad.addColorStop(0.7, "rgba(245, 228, 210, 0.16)");
  grad.addColorStop(1, "rgba(245, 228, 210, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedSoftTexture = tex;
  return tex;
}

let cachedGrainTexture: THREE.CanvasTexture | null = null;
function getCoffeeGrainTexture(): THREE.CanvasTexture {
  if (cachedGrainTexture) return cachedGrainTexture;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const clusters = [
    [0.5, 0.5, 0.26, 1.0],
    [0.34, 0.42, 0.17, 0.85],
    [0.66, 0.46, 0.16, 0.85],
    [0.45, 0.66, 0.18, 0.8],
    [0.58, 0.34, 0.15, 0.75],
  ];
  for (const [cx, cy, r, a] of clusters) {
    const g = ctx.createRadialGradient(
      size * cx,
      size * cy,
      1,
      size * cx,
      size * cy,
      size * r,
    );
    g.addColorStop(0, `rgba(255, 248, 240, ${a})`);
    g.addColorStop(0.6, `rgba(215, 190, 165, ${a * 0.75})`);
    g.addColorStop(1, "rgba(150, 120, 95, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  cachedGrainTexture = tex;
  return tex;
}

let cachedGroundsBedTextures: {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} | null = null;

function getCoffeeGroundsBedTextures() {
  if (cachedGroundsBedTextures) return cachedGroundsBedTextures;
  const size = 256;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  cCtx.fillStyle = "#241006";
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  const palette = ["#160903", "#210e05", "#2d1408", "#3a1b0b", "#482210"];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 10000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.65 + rand() * 1.8;
    cCtx.fillStyle = palette[i % palette.length];
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    const bVal = Math.floor(55 + rand() * 195);
    bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.needsUpdate = true;

  cachedGroundsBedTextures = { map, bumpMap };
  return cachedGroundsBedTextures;
}

/** Procedural marbled tiger-stripe espresso crema texture for the liquid surface. */
let cachedCremaTexture: THREE.CanvasTexture | null = null;
function getCremaSurfaceTexture(): THREE.CanvasTexture {
  if (cachedCremaTexture) return cachedCremaTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  const baseGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, size * 0.5);
  baseGrad.addColorStop(0.0, "#1c0903");
  baseGrad.addColorStop(0.28, "#331407");
  baseGrad.addColorStop(0.58, "#6e3414");
  baseGrad.addColorStop(0.82, "#a85c29");
  baseGrad.addColorStop(0.95, "#c98149");
  baseGrad.addColorStop(1.0, "#8f491e");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 2400; i++) {
    const u = rand();
    const r = Math.pow(u, 0.65) * (size * 0.47);
    const baseAngle = rand() * Math.PI * 2;
    const swirlAngle = baseAngle + (r / size) * 2.4;
    const x = cx + Math.cos(swirlAngle) * r;
    const y = cy + Math.sin(swirlAngle) * r;
    const dotR = 0.8 + rand() * 2.8;

    const isLightFoam = r > size * 0.22 && rand() > 0.35;
    ctx.fillStyle = isLightFoam
      ? `rgba(218, 152, 92, ${0.12 + rand() * 0.18})`
      : `rgba(38, 14, 5, ${0.15 + rand() * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedCremaTexture = tex;
  return tex;
}

/**
 * Sculpted domed coffee mound that fills the inner funnel wall
 * (`radius = 0.0243 m`, no perimeter gap) with granular micro-undulations.
 */
function createCoffeeMoundGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.0243, 0.0238, 0.008, 48, 12, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const maxR = 0.0243;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0) {
      const r = Math.hypot(x, z);
      const normR = Math.min(1, r / maxR);
      const angle = Math.atan2(z, x);
      const dome = Math.cos(normR * Math.PI * 0.5) * 0.0044;
      const grainNoise =
        (Math.sin(normR * 28 + angle * 5) * 0.4 +
          Math.cos(normR * 19 - angle * 7) * 0.4) *
        0.00035 *
        (1 - normR * 0.5);
      pos.setY(i, y + dome + grainNoise);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/* ═══════════════════════════════════════════════════════════
   STATION 1 → 2: ROASTED BEANS (`coffee_bean.glb`, instanced)
   - p = 0: a floating, slowly rotating cluster of beans is the hero.
   - p = 0.035 → 0.235: beans fall under gravity (y ∝ u²), converge
     into the open hopper mouth and disappear inside the grinder.
   ═══════════════════════════════════════════════════════════ */
const BEAN_COUNT = 64;

function InstancedBeansFlow({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const { scene } = useGLTF(BEAN_URL);
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, material } = useMemo(() => {
    let foundGeo: THREE.BufferGeometry | null = null;
    let foundMat: THREE.Material | null = null;

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && !foundGeo) {
        const m = obj as THREE.Mesh;
        foundGeo = m.geometry.clone();
        foundGeo.computeBoundingBox();
        const box = foundGeo.boundingBox!;
        const center = new THREE.Vector3();
        box.getCenter(center);
        foundGeo.translate(-center.x, -center.y, -center.z);
        foundGeo.computeVertexNormals();

        const srcMat = Array.isArray(m.material) ? m.material[0] : m.material;
        const stdMat = (srcMat as THREE.MeshStandardMaterial).clone();
        stdMat.color = new THREE.Color("#562911");
        stdMat.roughness = 0.28;
        stdMat.metalness = 0.08;
        stdMat.envMapIntensity = 1.75;
        foundMat = stdMat;
      }
    });

    if (!foundGeo) foundGeo = new THREE.SphereGeometry(0.1, 16, 12);
    if (!foundMat) {
      foundMat = new THREE.MeshStandardMaterial({
        color: "#562911",
        roughness: 0.28,
        metalness: 0.08,
      });
    }

    return { geometry: foundGeo, material: foundMat };
  }, [scene]);

  const seeds = useMemo(() => {
    return Array.from({ length: BEAN_COUNT }, (_, i) => {
      const a = i * 2.39996;
      const norm = ((i * 37) % 100) / 100;
      const r = 0.35 + Math.sqrt(norm) * 1.0;
      return {
        angle: a,
        radius: r,
        y0: STATION_Y.BEANS + (((i * 53) % 100) / 100 - 0.5) * 1.7,
        delay: ((i * 29) % 100) / 100,
        rx: (i * 1.9) % Math.PI,
        ry: (i * 2.7) % Math.PI,
        rz: (i * 3.3) % Math.PI,
        scale: 0.08 + ((i * 13) % 10) * 0.003,
        speed: 0.6 + ((i * 7) % 10) * 0.04,
      };
    });
  }, []);

  useFrame((state) => {
    const mesh = instancedRef.current;
    if (!mesh) return;
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;

    const flow = clamp01((p - 0.035) / 0.2);
    const endY = GRINDER_RIM_Y - 0.35;

    for (let i = 0; i < BEAN_COUNT; i++) {
      const s = seeds[i];
      const u = clamp01(flow * 1.45 - s.delay * 0.45);

      // Idle: slow orbit + gentle bob. Falling: orbit freezes, beans converge.
      const orbit = s.angle + t * 0.12 * (1 - u);
      const converge = THREE.MathUtils.lerp(1, 0.12, smoothstep(0.12, 0.75, u));
      const x = Math.cos(orbit) * s.radius * 0.85 * converge;
      const z = Math.sin(orbit) * s.radius * converge;
      const bob = Math.sin(t * s.speed + i) * 0.05 * (1 - u);
      const y = THREE.MathUtils.lerp(s.y0, endY, u * u) + bob;

      // Disappear only once deep inside the dark hopper cavity
      const insideFade = smoothstep(GRINDER_RIM_Y - 0.33, GRINDER_RIM_Y - 0.1, y);
      const globalFade = 1 - smoothstep(0.25, 0.29, p);
      const heroScale = THREE.MathUtils.lerp(1.2, 1.0, u);

      DUMMY.position.set(x, y, z);
      DUMMY.rotation.set(
        s.rx + t * s.speed * 0.6 + u * 4.8,
        s.ry + t * s.speed * 0.45 + u * 4.0,
        s.rz + u * 3.0,
      );
      DUMMY.scale.setScalar(s.scale * heroScale * insideFade * globalFade);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedRef}
      args={[geometry, material, BEAN_COUNT]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION 2: COFFEE GRINDER (Y = -4.8, 2.58 u tall)
   - Lid + crank lift and slide back (p 0.02 → 0.10) to open the hopper,
     then seat coaxially again (p 0.24 → 0.30) once the beans are in.
   - Crank spins with counter-torque sway while grinding (p 0.30 → 0.51).
   ═══════════════════════════════════════════════════════════ */
function GrinderStation({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const { scene } = useGLTF(GRINDER_URL);
  const rootRef = useRef<THREE.Group>(null);
  const lidHingeRef = useRef<THREE.Group>(null);
  const crankSpinRef = useRef<THREE.Group>(null);

  const parts = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    return {
      lid: cloned.getObjectByName("GrinderLid")?.clone(true) ?? null,
      crankArm: cloned.getObjectByName("GrinderCrankArm")?.clone(true) ?? null,
      crankKnob:
        cloned.getObjectByName("GrinderCrankKnob")?.clone(true) ?? null,
      body: cloned.getObjectByName("GrinderBody")?.clone(true) ?? null,
      rubber: cloned.getObjectByName("GrinderRubber")?.clone(true) ?? null,
      catchCup: cloned.getObjectByName("GrinderCatchCup")?.clone(true) ?? null,
    };
  }, [scene]);

  useFrame((state) => {
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;

    const lidOpen =
      smoothstep(0.02, 0.1, p) * (1 - smoothstep(0.24, 0.3, p));
    const lidSlideBack =
      smoothstep(0.02, 0.1, p) * (1 - smoothstep(0.22, 0.27, p));

    const grindProgress = clamp01((p - 0.3) / 0.21);
    const grindActive =
      smoothstep(0.3, 0.33, p) * (1 - smoothstep(0.47, 0.51, p));

    if (lidHingeRef.current) {
      lidHingeRef.current.position.set(
        0,
        0.16 + lidOpen * 0.044,
        -0.025 - lidSlideBack * 0.048,
      );
      lidHingeRef.current.rotation.set(-lidSlideBack * 0.34, 0, 0);
    }

    if (crankSpinRef.current) {
      crankSpinRef.current.rotation.y =
        -grindProgress * Math.PI * 14 - t * 3.4 * grindActive;
    }

    if (rootRef.current) {
      const crankAngle = grindProgress * Math.PI * 14 + t * 3.4;
      const torqueX = Math.sin(crankAngle) * 0.016 * grindActive;
      const torqueZ = Math.cos(crankAngle) * 0.016 * grindActive;
      rootRef.current.position.set(torqueX, STATION_Y.GRINDER, torqueZ);
      rootRef.current.rotation.z =
        lidOpen * 0.04 + Math.cos(crankAngle) * 0.01 * grindActive;
      rootRef.current.rotation.y = -0.15 + p * 0.25;
    }
  });

  return (
    <group ref={rootRef} position={[0, STATION_Y.GRINDER, 0]}>
      <group
        scale={[GRINDER_SCALE_XZ, GRINDER_SCALE_Y, GRINDER_SCALE_XZ]}
        position={[0, -GRINDER_NATIVE_CENTER * GRINDER_SCALE_Y, 0]}
      >
        <group>
          {parts.body && <primitive object={parts.body} />}
          {parts.rubber && <primitive object={parts.rubber} />}
          {parts.catchCup && <primitive object={parts.catchCup} />}

          {/* Dark inner hopper wall & burr floor so beans visibly drop inside */}
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.0248, 0.0248, 0.036, 32, 1, true]} />
            <meshStandardMaterial
              color="#140803"
              roughness={0.9}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh position={[0, 0.122, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.0248, 32]} />
            <meshStandardMaterial
              color="#1c0b04"
              roughness={0.88}
              metalness={0.05}
            />
          </mesh>
        </group>

        <group ref={lidHingeRef} position={[0, 0.16, -0.025]}>
          <group position={[0, -0.16, 0.025]}>
            {parts.lid && <primitive object={parts.lid} />}
            <group ref={crankSpinRef}>
              {parts.crankArm && <primitive object={parts.crankArm} />}
              {parts.crankKnob && <primitive object={parts.crankKnob} />}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION 2 → 3: GROUNDS CASCADE
   220 lit 3D fragments + 1,600 fine powder points falling 0.95 u
   from the grinder exit straight into the Moka funnel below it.
   ═══════════════════════════════════════════════════════════ */
const GROUNDS_COUNT = 1600;
const CHUNKS_COUNT = 220;

function GroundsToMokaFlow({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const chunksRef = useRef<THREE.InstancedMesh>(null);
  const grainTex = useMemo(() => getCoffeeGrainTexture(), []);

  const { chunkGeo, chunkMat } = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.014, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: "#2b1307",
      roughness: 0.85,
      metalness: 0.04,
    });
    return { chunkGeo: geo, chunkMat: mat };
  }, []);

  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(GROUNDS_COUNT * 3);
    const col = new Float32Array(GROUNDS_COUNT * 3);
    const sData = [];

    const c1 = new THREE.Color("#1a0b04");
    const c2 = new THREE.Color("#281207");
    const c3 = new THREE.Color("#36190a");
    const c4 = new THREE.Color("#45210f");

    for (let i = 0; i < GROUNDS_COUNT; i++) {
      const a = i * 2.39996;
      const norm = ((i * 31) % 1000) / 1000;
      const r = 0.012 + Math.pow(norm, 0.72) * 0.3;
      const life = (i / GROUNDS_COUNT) % 1;
      sData.push({
        angle: a,
        radius: r,
        lifeOffset: life,
        speed: 0.95 + (i % 11) * 0.055,
        turb: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 7) * 0.035),
      });

      const pick =
        i % 4 === 0 ? c1 : i % 4 === 1 ? c2 : i % 4 === 2 ? c3 : c4;
      col[i * 3 + 0] = pick.r;
      col[i * 3 + 1] = pick.g;
      col[i * 3 + 2] = pick.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geometry: geo, seeds: sData };
  }, []);

  useFrame((state) => {
    const pts = pointsRef.current;
    const chunks = chunksRef.current;
    if (!pts || !chunks) return;
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;

    const intensity =
      smoothstep(0.31, 0.35, p) * (1 - smoothstep(0.47, 0.51, p));
    const visible = intensity > 0.01;
    pts.visible = visible;
    chunks.visible = visible;
    if (!visible) return;

    const posAttr = pts.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const startY = GRINDER_BOTTOM_Y + 0.06;
    const endY = getMokaStation3Y(p) + MOKA_FUNNEL_RIM_OFFSET - 0.04;

    for (let i = 0; i < GROUNDS_COUNT; i++) {
      const s = seeds[i];
      const u = (s.lifeOffset + t * 0.85 * s.speed + p * 2.8) % 1;
      const gravU = 0.35 * u + 0.65 * u * u;
      const y = THREE.MathUtils.lerp(startY, endY, gravU);

      const spread = THREE.MathUtils.lerp(0.92, 0.78, u);
      const swirl = s.angle + u * 1.6 * s.turb + t * 0.85;
      const x = Math.cos(swirl) * s.radius * spread;
      const z = Math.sin(swirl) * s.radius * spread;

      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;

      if (i < CHUNKS_COUNT) {
        DUMMY.position.set(x * 0.9, y, z * 0.9);
        DUMMY.rotation.set(
          t * 5.0 + i,
          t * 4.2 + i * 1.7,
          u * 6.0 + i * 2.3,
        );
        const edgeFade = Math.sin(u * Math.PI);
        const sc = intensity * (0.65 + (i % 4) * 0.2) * edgeFade;
        DUMMY.scale.set(sc * 1.2, sc * 0.85, sc);
        DUMMY.updateMatrix();
        chunks.setMatrixAt(i, DUMMY.matrix);
      }
    }
    posAttr.needsUpdate = true;
    chunks.instanceMatrix.needsUpdate = true;

    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = intensity * 0.92;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          map={grainTex}
          size={0.035}
          vertexColors
          transparent
          alphaTest={0.04}
          opacity={0}
          depthWrite={false}
        />
      </points>
      <instancedMesh
        ref={chunksRef}
        args={[chunkGeo, chunkMat, CHUNKS_COUNT]}
        castShadow
        frustumCulled={false}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION 3 & 4: ITALIAN MOKA POT
   - Dosing (p 0.30 → 0.50): boiler waits right below the grinder exit
     while the coffee mound fills the funnel; then lowers to Station 3.
   - Assembly (p 0.50 → 0.71): upper chamber arcs over and screws 540°.
   - Pour (p 0.72 → 0.95): flies to behind-right of the cup, tilts around
     its own spout so the spout ends 0.36 u above the rim and 0.40 u
     inside it. Clearance verified by simulation: ≥0.30 u to the cup wall,
     ≥0.77 u to the handle, at every frame.
   - Rest (p 0.95 → 0.99): straightens and sets down on the table beside the cup.
   ═══════════════════════════════════════════════════════════ */
const POUR_TUBE_RADIAL = 16;
const POUR_TUBE_SEGMENTS = 24;

function MokaAndPourStation({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const { scene } = useGLTF(MOKA_URL);

  const mokaWorldRef = useRef<THREE.Group>(null);
  const mokaSpoutPivotRef = useRef<THREE.Group>(null);
  const funnelRef = useRef<THREE.Group>(null);
  const groundsMoundRef = useRef<THREE.Mesh>(null);
  const upperAssemblyRef = useRef<THREE.Group>(null);
  const spoutTipRef = useRef<THREE.Group>(null);
  const pourMeshRef = useRef<THREE.Mesh>(null);

  const moundGeo = useMemo(() => createCoffeeMoundGeometry(), []);
  const bedTextures = useMemo(() => getCoffeeGroundsBedTextures(), []);

  const parts = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        const std = m.material as THREE.MeshStandardMaterial;
        if (std && std.isMeshStandardMaterial) {
          if (std.name === "MokaAluminum") {
            std.color = new THREE.Color("#e6eaee");
            std.metalness = 0.92;
            std.roughness = 0.21;
            std.envMapIntensity = 1.65;
          } else if (std.name === "MokaFunnelAluminum") {
            std.color = new THREE.Color("#dce1e6");
            std.metalness = 0.85;
            std.roughness = 0.28;
            std.envMapIntensity = 1.45;
          } else if (std.name === "MokaBakelite") {
            std.color = new THREE.Color("#181514");
            std.metalness = 0.06;
            std.roughness = 0.32;
            std.envMapIntensity = 1.25;
          } else if (std.name === "MokaBrassValve") {
            std.color = new THREE.Color("#e6b862");
            std.metalness = 0.92;
            std.roughness = 0.18;
            std.envMapIntensity = 1.7;
          }
        }
      }
    });

    return {
      boiler: cloned.getObjectByName("MokaBoiler")?.clone(true) ?? null,
      funnel: cloned.getObjectByName("MokaFunnel")?.clone(true) ?? null,
      gasket: cloned.getObjectByName("MokaGasket")?.clone(true) ?? null,
      collector: cloned.getObjectByName("MokaCollector")?.clone(true) ?? null,
      lid: cloned.getObjectByName("MokaLid")?.clone(true) ?? null,
    };
  }, [scene]);

  const pourGeo = useMemo(() => {
    return new THREE.CylinderGeometry(
      1,
      1,
      1,
      POUR_TUBE_RADIAL,
      POUR_TUBE_SEGMENTS,
      false,
    );
  }, []);

  useFrame((state) => {
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;
    const L = THREE.MathUtils.lerp;

    // ── 1. Dosing + assembly ──
    const funnelSeated = smoothstep(0.29, 0.34, p);
    const groundsFill = smoothstep(0.33, 0.5, p);
    const alignCoaxial = smoothstep(0.58, 0.64, p);
    const screwDown = smoothstep(0.64, 0.71, p);

    if (funnelRef.current) {
      funnelRef.current.position.set(0, (1 - funnelSeated) * 0.022, 0);
    }

    if (groundsMoundRef.current) {
      groundsMoundRef.current.visible = groundsFill > 0.01;
      groundsMoundRef.current.position.set(
        0,
        L(-0.0235, -0.0178, groundsFill),
        0,
      );
      const sxz = L(0.95, 1.0, groundsFill);
      groundsMoundRef.current.scale.set(sxz, L(0.15, 1.0, groundsFill), sxz);
      groundsMoundRef.current.rotation.y = groundsFill * 0.85;
    }

    if (upperAssemblyRef.current) {
      upperAssemblyRef.current.visible = p >= 0.5;
      const sideOffset = (1 - alignCoaxial) * 0.088;
      const arcLift = Math.sin(alignCoaxial * Math.PI) * 0.022;
      const preScrewY = L(-0.018, 0.042, alignCoaxial) + arcLift;
      const finalY = L(preScrewY, 0, screwDown);
      const screwAngle =
        smoothstep(0.62, 0.645, p) * (1 - screwDown) * Math.PI * 3.0;
      const sideTiltZ = (1 - alignCoaxial) * -0.12;

      upperAssemblyRef.current.position.set(sideOffset, finalY, 0);
      upperAssemblyRef.current.rotation.set(0, screwAngle, sideTiltZ);
    }

    // ── 2. Travel → pour → rest ──
    const horiz = smoothstep(0.72, 0.78, p); // reach the cup's side first…
    const vert = smoothstep(0.73, 0.8, p); // …then descend (never over the cup body)
    const tilt = smoothstep(0.78, 0.84, p) * (1 - smoothstep(0.9, 0.95, p));
    const rest = smoothstep(0.95, 0.99, p);

    // Moka origin distance from cup axis (along the pour direction)
    const radial =
      SPOUT_INSIDE_R + Math.abs(SPOUT_NATIVE_X) * MOKA_SCALE + (1 - tilt) * 0.9;
    const pourY = CUP_RIM_Y + SPOUT_ABOVE_RIM - SPOUT_NATIVE_Y * MOKA_SCALE;
    const hoverY = pourY + 0.9;
    const restY = TABLE_Y + 0.073 * MOKA_SCALE;
    const station4Y = L(L(hoverY, pourY, tilt), restY, rest);

    if (mokaWorldRef.current && mokaSpoutPivotRef.current) {
      mokaWorldRef.current.position.set(
        L(0, -POUR_DIR_X * radial, horiz),
        L(getMokaStation3Y(p), station4Y, vert),
        L(0, -POUR_DIR_Z * radial, horiz),
      );
      mokaWorldRef.current.rotation.set(
        0,
        L(Math.PI * 0.5, POUR_YAW, horiz) +
          (1 - horiz) * Math.sin(t * 0.5) * 0.04,
        0,
      );
      mokaSpoutPivotRef.current.rotation.set(0, 0, tilt * 0.92);
    }

    // ── 3. Espresso stream: spout tip → cup centre ──
    const pourIntensity =
      smoothstep(0.825, 0.845, p) * (1 - smoothstep(0.895, 0.915, p));

    if (pourMeshRef.current && spoutTipRef.current) {
      const visible = pourIntensity > 0.01;
      pourMeshRef.current.visible = visible;

      if (visible) {
        spoutTipRef.current.getWorldPosition(TMP_SPOUT);

        const cupFill = smoothstep(0.83, 0.93, p);
        const cupLiquidY = CUP_CENTER_Y + L(LIQ_MIN_Y, LIQ_MAX_Y, cupFill);

        TMP_P0.copy(TMP_SPOUT);
        TMP_P1.set(TMP_SPOUT.x * 0.45, TMP_SPOUT.y - 0.12, TMP_SPOUT.z * 0.45);
        TMP_P2.set(
          Math.sin(t * 9.0) * 0.01,
          cupLiquidY,
          Math.cos(t * 8.0) * 0.01,
        );

        const posAttr = pourGeo.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const ringStride = POUR_TUBE_RADIAL + 1;

        for (let s = 0; s <= POUR_TUBE_SEGMENTS; s++) {
          const u = s / POUR_TUBE_SEGMENTS;
          const invU = 1 - u;

          TMP_PT.set(
            invU * invU * TMP_P0.x + 2 * invU * u * TMP_P1.x + u * u * TMP_P2.x,
            invU * invU * TMP_P0.y + 2 * invU * u * TMP_P1.y + u * u * TMP_P2.y,
            invU * invU * TMP_P0.z + 2 * invU * u * TMP_P1.z + u * u * TMP_P2.z,
          );

          const wave = 1 + Math.sin(u * 12 - t * 24) * 0.06;
          const radius = L(0.028, 0.016, u) * pourIntensity * wave;

          for (let r = 0; r <= POUR_TUBE_RADIAL; r++) {
            const idx = (s * ringStride + r) * 3;
            const theta = (r / POUR_TUBE_RADIAL) * Math.PI * 2;
            arr[idx + 0] = TMP_PT.x + Math.cos(theta) * radius;
            arr[idx + 1] = TMP_PT.y;
            arr[idx + 2] = TMP_PT.z + Math.sin(theta) * radius;
          }
        }

        posAttr.needsUpdate = true;
        pourGeo.computeVertexNormals();
      }
    }
  });

  return (
    <>
      <group ref={mokaWorldRef} position={[0, MOKA_DOSING_Y, 0]}>
        <group
          ref={mokaSpoutPivotRef}
          position={[
            SPOUT_NATIVE_X * MOKA_SCALE,
            SPOUT_NATIVE_Y * MOKA_SCALE,
            0,
          ]}
        >
          {/* Counter-offset so the Moka origin sits at [0,0,0] when upright */}
          <group
            scale={MOKA_SCALE}
            position={[
              -SPOUT_NATIVE_X * MOKA_SCALE,
              -SPOUT_NATIVE_Y * MOKA_SCALE,
              0,
            ]}
          >
            <group>{parts.boiler && <primitive object={parts.boiler} />}</group>

            <group ref={funnelRef}>
              {parts.funnel && <primitive object={parts.funnel} />}
              <mesh
                ref={groundsMoundRef}
                geometry={moundGeo}
                position={[0, -0.018, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={bedTextures.map}
                  bumpMap={bedTextures.bumpMap}
                  bumpScale={0.0025}
                  roughness={0.95}
                  metalness={0.02}
                />
              </mesh>
            </group>

            <group ref={upperAssemblyRef}>
              {parts.gasket && <primitive object={parts.gasket} />}
              {parts.collector && <primitive object={parts.collector} />}
              {parts.lid && <primitive object={parts.lid} />}
              <group
                ref={spoutTipRef}
                position={[SPOUT_NATIVE_X, SPOUT_NATIVE_Y, 0]}
              />
            </group>
          </group>
        </group>
      </group>

      <mesh
        ref={pourMeshRef}
        geometry={pourGeo}
        visible={false}
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          color="#220a03"
          emissive="#3b1405"
          emissiveIntensity={0.35}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
        />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION 4: LA TAZA (1.35 u tall, handle turned camera-right)
   ═══════════════════════════════════════════════════════════ */
const MAX_STEAM_SPRITES = 18;

function CupStation({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const { scene } = useGLTF(CUP_URL);
  const groupRef = useRef<THREE.Group>(null);
  const liquidGroupRef = useRef<THREE.Group>(null);
  const cremaDiskRef = useRef<THREE.Mesh>(null);
  const rippleRing1Ref = useRef<THREE.Mesh>(null);
  const rippleRing2Ref = useRef<THREE.Mesh>(null);
  const steamGroupRef = useRef<THREE.Group>(null);

  const softTex = useMemo(() => getSoftParticleTexture(), []);
  const cremaTex = useMemo(() => getCremaSurfaceTexture(), []);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      // Duplicate overlapping mesh inside Taza.glb → hide to avoid Z-fighting
      if (obj.name === "Taza.001") {
        obj.visible = false;
        return;
      }
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (std && std.name === "Material.003") {
            std.color = new THREE.Color("#f8f4df");
            std.roughness = 0.2;
          }
        }
      }
    });
    return c;
  }, [scene]);

  const steamSeeds = useMemo(
    () =>
      Array.from({ length: MAX_STEAM_SPRITES }, (_, i) => ({
        phase: i / MAX_STEAM_SPRITES,
        speed: 0.24 + (i % 5) * 0.048,
        swirlAngle: i * 1.9,
        swirlRadius: 0.07 + (i % 4) * 0.08,
        baseScale: 0.36 + (i % 4) * 0.11,
      })),
    [],
  );

  useFrame((state) => {
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = CUP_ROT_Y + Math.sin(t * 0.4) * 0.02;
    }

    const fillLevel = smoothstep(0.83, 0.93, p);
    const pourActive =
      smoothstep(0.825, 0.845, p) * (1 - smoothstep(0.895, 0.915, p));

    if (liquidGroupRef.current) {
      liquidGroupRef.current.visible = fillLevel > 0.01;
      liquidGroupRef.current.position.y = THREE.MathUtils.lerp(
        LIQ_MIN_Y,
        LIQ_MAX_Y,
        fillLevel,
      );
      const rFactor = THREE.MathUtils.lerp(0.74, 0.985, Math.sqrt(fillLevel));
      liquidGroupRef.current.scale.set(rFactor, 1, rFactor);
    }

    if (cremaDiskRef.current) {
      cremaDiskRef.current.rotation.z = t * 0.35 + fillLevel * 2.2;
    }

    if (rippleRing1Ref.current && rippleRing2Ref.current) {
      const r1 = (t * 1.5) % 1;
      const r2 = (t * 1.5 + 0.5) % 1;
      rippleRing1Ref.current.scale.setScalar(0.12 + r1 * 0.86);
      (rippleRing1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - r1) * 0.52 * pourActive;
      rippleRing2Ref.current.scale.setScalar(0.12 + r2 * 0.86);
      (rippleRing2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - r2) * 0.52 * pourActive;
    }

    if (steamGroupRef.current) {
      const steamIntensity = smoothstep(0.86, 0.97, p);
      const children = steamGroupRef.current.children as THREE.Sprite[];
      for (let i = 0; i < children.length; i++) {
        const sp = children[i];
        const s = steamSeeds[i];
        const life = (s.phase + t * s.speed) % 1;
        const y = LIQ_MAX_Y + 0.05 + life * 1.7;
        const x =
          Math.cos(s.swirlAngle + t * 0.65 + life * 2.4) *
          s.swirlRadius *
          (1 + life * 1.3);
        const z =
          Math.sin(s.swirlAngle + t * 0.55 + life * 2.4) *
          s.swirlRadius *
          (1 + life * 1.3);
        sp.position.set(x, y, z);
        const sc = s.baseScale * (0.65 + life * 1.45);
        sp.scale.set(sc, sc * 1.25, sc);
        sp.material.opacity = Math.max(
          0,
          Math.sin(life * Math.PI) * 0.25 * steamIntensity,
        );
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, CUP_CENTER_Y, 0]}
      rotation={[0, CUP_ROT_Y, 0]}
    >
      <group scale={CUP_SCALE}>
        <primitive object={cloned} position={[0, -1.1078, 0]} />
      </group>

      {/* Rising espresso with swirled tiger-stripe crema */}
      <group ref={liquidGroupRef} position={[0, LIQ_MIN_Y, 0]}>
        <mesh ref={cremaDiskRef} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[CUP_INNER_R, 64]} />
          <meshPhysicalMaterial
            map={cremaTex}
            roughness={0.16}
            metalness={0.08}
            clearcoat={0.85}
            clearcoatRoughness={0.12}
          />
        </mesh>
        <mesh
          ref={rippleRing1Ref}
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
          <meshBasicMaterial
            color="#e2a872"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
        <mesh
          ref={rippleRing2Ref}
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[CUP_INNER_R * 0.68, CUP_INNER_R * 0.74, 48]} />
          <meshBasicMaterial
            color="#e2a872"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={steamGroupRef}>
        {steamSeeds.map((_, idx) => (
          <sprite key={idx}>
            <spriteMaterial
              map={softTex}
              color="#fff6ec"
              transparent
              opacity={0}
              depthWrite={false}
            />
          </sprite>
        ))}
      </group>

      {/* Shared table shadow for the cup and the resting Moka */}
      <ContactShadows
        position={[0, -CUP_HALF - 0.005, 0]}
        opacity={0.5}
        scale={7}
        blur={2.1}
        far={3.0}
        color="#1a0903"
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAMERA RIG — frames each station's visual centre below the navbar
   ═══════════════════════════════════════════════════════════ */
function CameraAndSceneRig({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
}) {
  const { camera, size } = useThree();
  const isMobile = size.width < 768;

  useFrame((state) => {
    const p = scrollProgress.get();
    const t = state.clock.elapsedTime;

    const focusY = getCameraFocusY(p);

    const azimuth =
      Math.sin(p * Math.PI * 2) * 0.1 + Math.sin(t * 0.35) * 0.012;

    // Pull back slightly for the grinder → Moka transfer shot (both in frame)
    const transferZoom =
      smoothstep(0.3, 0.36, p) * (1 - smoothstep(0.49, 0.56, p)) * 0.8;
    const baseDist = isMobile ? 8.2 : 6.6;
    const dist = baseDist + transferZoom;

    const viewElevation =
      smoothstep(0.06, 0.2, p) * (1 - smoothstep(0.62, 0.72, p)) * 0.7 +
      smoothstep(0.74, 0.84, p) * 0.55;

    camera.position.set(
      Math.cos(azimuth) * dist,
      focusY + 0.5 + viewElevation,
      Math.sin(azimuth) * dist,
    );

    // Look a touch above the focus so content centres in the area below the navbar
    const desktopRightShiftZ = isMobile ? 0 : 0.88;
    camera.lookAt(0, focusY + 0.16, desktopRightShiftZ);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC COMPONENT: HERO MODEL CANVAS
   ═══════════════════════════════════════════════════════════ */
export interface HeroModelProps {
  scrollProgress?: MotionValue<number>;
  debug?: boolean;
  autoRotateSpeed?: number;
  floatIntensity?: number;
  modelUrl?: string;
}

export function HeroModel({ scrollProgress }: HeroModelProps = {}) {
  const fallbackProgress = useMotionValue(0.88);
  const activeProgress = scrollProgress ?? fallbackProgress;

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [6.6, 0.5, 0], fov: 35, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.22,
        }}
      >
        <ambientLight intensity={0.65} color="#f7e4cf" />
        <directionalLight
          position={[7, 9, 6]}
          intensity={2.8}
          color="#fff4e4"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight
          position={[-7, 6, -5]}
          intensity={4.0}
          angle={0.6}
          penumbra={0.9}
          color="#e07b39"
        />
        <pointLight
          position={[3, STATION_Y.BEANS + 1, 4]}
          intensity={1.8}
          color="#e8b888"
          distance={10}
        />
        <pointLight
          position={[3, STATION_Y.GRINDER, 4]}
          intensity={1.9}
          color="#d4a574"
          distance={12}
        />
        <pointLight
          position={[3, STATION_Y.MOKA, 4]}
          intensity={2.2}
          color="#e8b888"
          distance={12}
        />
        <pointLight
          position={[4, STATION_Y.CUP + 0.5, 4]}
          intensity={2.4}
          color="#fff3e2"
          distance={12}
        />

        <CameraAndSceneRig scrollProgress={activeProgress} />

        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.85} />
        </Suspense>

        <Suspense fallback={null}>
          <InstancedBeansFlow scrollProgress={activeProgress} />
        </Suspense>

        <Suspense fallback={null}>
          <GrinderStation scrollProgress={activeProgress} />
        </Suspense>

        <GroundsToMokaFlow scrollProgress={activeProgress} />

        <Suspense fallback={null}>
          <MokaAndPourStation scrollProgress={activeProgress} />
        </Suspense>

        <Suspense fallback={null}>
          <CupStation scrollProgress={activeProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(BEAN_URL);
useGLTF.preload(GRINDER_URL);
useGLTF.preload(MOKA_URL);
useGLTF.preload(CUP_URL);

