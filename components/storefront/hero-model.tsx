"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  ContactShadows,
  useGLTF,
  Center,
  OrbitControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { Group, Sprite, SpriteMaterial } from "three";

// ─────────────────────────────────────────────────────────────────────────────
// HeroModel — Blender-exported .glb rendered as the hero's focal object.
//
// Design decisions (per the 3d-web-experience playbook):
//  • The model is MEASURED on load (bounding box) so the steam emits from the
//    real cup rim — no magic numbers, works if you swap the .glb.
//  • Continuous sway (not scroll-tied) so motion never freezes; keeps the
//    branded face visible instead of spinning it away.
//  • Steam is subtle billboard sprites born at the rim, rising a short way and
//    dissolving — reads as vapour, not a grey blob.
//  • Loading state with progress; DPR + particle count scale down on mobile.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_URL = "/models/Taza.glb";

// Camera angle chosen interactively via /debug-3d and baked. The raw vector
// is scaled outward (same direction = same angle) to pull the cup back from
// the edges and leave headroom for rising steam. Increase to zoom out.
const CAMERA_DISTANCE_SCALE = 1.4;
const CAMERA_POSITION: [number, number, number] = [
  9.54 * CAMERA_DISTANCE_SCALE,
  0.87 * CAMERA_DISTANCE_SCALE,
  0.63 * CAMERA_DISTANCE_SCALE,
];

type ModelBounds = { height: number; radius: number };

// ── Soft puff texture, baked once ───────────────────────────────────────────
function makeSmokeTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  g.addColorStop(0, "rgba(255,251,243,0.85)");
  g.addColorStop(0.4, "rgba(255,246,232,0.32)");
  g.addColorStop(1, "rgba(255,246,232,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Model — loads, measures its bounding box, reports size up ────────────────
function Model({
  url,
  onBounds,
}: {
  url: string;
  onBounds: (b: ModelBounds) => void;
}) {
  const { scene } = useGLTF(url);
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const sz = new THREE.Vector3();
    box.getSize(sz);
    onBounds({ height: sz.y, radius: Math.max(sz.x, sz.z) / 2 });
  }, [scene, onBounds]);
  return <primitive object={scene} />;
}

// ── Steam3D — vapour rising from the measured cup rim ────────────────────────
function Steam3D({
  bounds,
  count = 16,
  maxOpacity = 0.32,
}: {
  bounds: ModelBounds;
  count?: number;
  maxOpacity?: number;
}) {
  const texture = useMemo(() => makeSmokeTexture(), []);
  const sprites = useRef<(Sprite | null)[]>([]);

  // After <Center>, the model's top sits at +height/2. Steam is born just
  // below the rim and rises about one cup-height, staying tethered to it.
  const rimY = bounds.height * 0.46;
  const rise = bounds.height * 0.95;
  const spread = bounds.radius * 0.5;
  const baseSize = bounds.radius * 0.7;

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        phase: Math.random(),
        speed: 0.09 + Math.random() * 0.08,
        xOff: (Math.random() - 0.5) * spread,
        zOff: (Math.random() - 0.5) * spread,
        swayAmp: 0.5 + Math.random() * 0.7,
        swayFreq: 0.5 + Math.random() * 0.8,
        scaleJitter: 0.7 + Math.random() * 0.5,
      })),
    // Reseed only when the emitter geometry changes.
    [count, spread],
  );

  useFrame((state) => {
    if (!texture) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const sp = sprites.current[i];
      if (!sp) continue;
      const life = (t * s.speed + s.phase) % 1;
      sp.position.y = rimY + life * rise;
      // Widen the drift as it climbs (turbulence) — scaled to the cup radius.
      sp.position.x =
        s.xOff +
        Math.sin(life * Math.PI * 2 * s.swayFreq + s.phase * 6) *
          s.swayAmp *
          spread *
          life;
      sp.position.z = s.zOff;
      const sc = baseSize * s.scaleJitter * (0.4 + life * 1.3);
      sp.scale.set(sc, sc, sc);
      // Sine bell: invisible at birth and death, peak mid-rise.
      (sp.material as SpriteMaterial).opacity = Math.sin(life * Math.PI) * maxOpacity;
    }
  });

  if (!texture) return null;
  return (
    <group>
      {seeds.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

// ── LiveMotion — continuous sway (logo stays visible) or full spin ───────────
function LiveMotion({
  children,
  speed = 0.3,
  sway = true,
  swayDeg = 20,
}: {
  children: ReactNode;
  speed?: number;
  sway?: boolean;
  swayDeg?: number;
}) {
  const ref = useRef<Group>(null);
  const swayRad = (swayDeg * Math.PI) / 180;
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    if (sway) {
      const t = state.clock.getElapsedTime();
      g.rotation.y = Math.sin(t * speed) * swayRad;
      g.rotation.x = Math.sin(t * speed * 0.55) * swayRad * 0.1;
    } else {
      g.rotation.y += delta * speed;
    }
  });
  return <group ref={ref}>{children}</group>;
}

// ── Error boundary: a missing/invalid .glb shows a neutral sphere, no crash ──
class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[HeroModel] Could not load the .glb:", error.message);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#d4a574" roughness={0.4} metalness={0.1} />
        </mesh>
      );
    }
    return this.props.children;
  }
}

// ── Loading indicator while the .glb downloads ───────────────────────────────
// A pure-CSS spinner (no useProgress) — useProgress dispatches state updates
// from inside other components' render (e.g. Environment's cube), which React
// 19 flags as a setState-in-render. The spinner sidesteps that entirely.
function Loader() {
  return (
    <Html center>
      <div
        aria-label="Cargando"
        style={{
          width: 26,
          height: 26,
          border: "2px solid rgba(255,255,255,0.14)",
          borderTopColor: "rgba(255,255,255,0.6)",
          borderRadius: "50%",
          animation: "hero-model-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes hero-model-spin{to{transform:rotate(360deg)}}`}</style>
    </Html>
  );
}

// ── Debug camera logger (only mounted when debug={true}) ─────────────────────
function CameraLogger() {
  const { camera } = useThree();
  const last = useRef(0);
  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    if (now - last.current < 0.4) return;
    last.current = now;
    const p = camera.position;
    const r = camera.rotation;
    console.log(
      `[CAM] position=[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]  ` +
        `rotation=[${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}]`,
    );
  });
  return null;
}

export function HeroModel({
  url = DEFAULT_URL,
  autoRotateSpeed = 0.3,
  floatIntensity = 0.32,
  sway = true,
  swayDeg = 20,
  steam = true,
  debug = false,
}: {
  url?: string;
  autoRotateSpeed?: number;
  floatIntensity?: number;
  sway?: boolean;
  swayDeg?: number;
  steam?: boolean;
  debug?: boolean;
}) {
  // Measured on load; steam waits until we know the real cup dimensions.
  const [bounds, setBounds] = useState<ModelBounds | null>(null);

  // Mobile-aware: fewer particles + lower DPR ceiling to protect battery/fps.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Warm key + cool fill: a neutral white mug gets dimension without
          washing out the printed logo. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 5]} intensity={2.1} color="#ffe8c8" />
      <directionalLight position={[-4, 3, -3]} intensity={0.65} color="#bcd4ff" />
      <directionalLight position={[0, -2, 4]} intensity={0.35} color="#ffffff" />

      <ModelErrorBoundary>
        <Suspense fallback={<Loader />}>
          <Float
            speed={1.1}
            rotationIntensity={floatIntensity > 0 ? 0.12 : 0}
            floatIntensity={floatIntensity}
            floatingRange={[-0.06, 0.06]}
          >
            <LiveMotion speed={autoRotateSpeed} sway={sway} swayDeg={swayDeg}>
              <Center>
                <Model url={url} onBounds={setBounds} />
              </Center>
            </LiveMotion>
          </Float>

          {/* Steam emits from the measured rim, upright (outside LiveMotion). */}
          {steam && bounds && (
            <Steam3D bounds={bounds} count={isMobile ? 9 : 16} />
          )}

          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.42}
            scale={5}
            blur={2.4}
            far={2}
          />
        </Suspense>

        {/* Environment in its own boundary so its HDRI download doesn't share
            the model's Suspense (and never feeds the loading spinner). */}
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.85} />
        </Suspense>
      </ModelErrorBoundary>

      {debug && (
        <>
          <OrbitControls enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} />
          <CameraLogger />
        </>
      )}
    </Canvas>
  );
}
