"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useMotionValue, type MotionValue } from "motion/react";
import {
  CUP_BASE_Y,
  GRINDER_OUTLET_Y,
  MOKA_DOSING_Y,
  STATION_Y,
} from "./hero3d/constants";
import { lerp, smoothstep } from "./hero3d/math";
import {
  DESKTOP_QUALITY,
  MOBILE_QUALITY,
  QualityContext,
} from "./hero3d/quality";
import { BeansStation } from "./hero3d/beans";
import { CupStation } from "./hero3d/cup";
import { GrinderStation, GroundsFlow } from "./hero3d/grinder";
import { MokaStation } from "./hero3d/moka";

/* ═══════════════════════════ CÁMARA ═══════════════════════════
   La cámara baja por el "riel" de estaciones siguiendo el scroll.
   getCameraFocusY devuelve la altura (Y) a la que mira en cada punto.   */

const TRANSFER_FOCUS_Y = (GRINDER_OUTLET_Y + MOKA_DOSING_Y + 0.3) / 2;

function getCameraFocusY(p: number): number {
  if (p <= 0.04) return STATION_Y.BEANS;
  if (p <= 0.22) return lerp(STATION_Y.BEANS, STATION_Y.GRINDER + 0.35, smoothstep(0.04, 0.22, p));
  // Molienda: se encuadra el molino COMPLETO (manivela arriba) para ver entrar los granos.
  if (p <= 0.3) return lerp(STATION_Y.GRINDER + 0.35, STATION_Y.GRINDER + 0.7, smoothstep(0.22, 0.3, p));
  if (p <= 0.36) return lerp(STATION_Y.GRINDER + 0.7, TRANSFER_FOCUS_Y, smoothstep(0.3, 0.36, p));
  if (p <= 0.49) return TRANSFER_FOCUS_Y;
  if (p <= 0.57) return lerp(TRANSFER_FOCUS_Y, STATION_Y.MOKA + 0.1, smoothstep(0.49, 0.57, p));
  if (p <= 0.72) return STATION_Y.MOKA + 0.1;
  if (p <= 0.8) return lerp(STATION_Y.MOKA + 0.1, CUP_BASE_Y + 1.2, smoothstep(0.72, 0.8, p));
  if (p <= 0.93) return CUP_BASE_Y + 1.2;
  return lerp(CUP_BASE_Y + 1.2, CUP_BASE_Y + 0.85, smoothstep(0.93, 1, p));
}

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const portrait = aspect < 0.9;

  useFrame((state) => {
    const p = progress.get();
    const t = state.clock.elapsedTime;
    const focusY = getCameraFocusY(p);
    const azimuth = Math.sin(p * Math.PI * 2) * 0.1 + Math.sin(t * 0.35) * 0.012;

    // En vertical (móvil) el ancho útil es pequeño: se aleja la cámara según la proporción.
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const fitWidth = (3.1 / aspect) / (2 * Math.tan((fov * Math.PI) / 360));
    const baseDist = portrait ? THREE.MathUtils.clamp(fitWidth, 7.8, 11.5) : 7.4;
    // Toma macro sobre los granos y las cerezas: la cámara se aleja al empezar a bajar.
    const macro = (1 - smoothstep(0.0, 0.14, p)) * 2.4;
    // Se aleja un poco para la toma del molino→moka y para el servido.
    const grindWide = smoothstep(0.14, 0.24, p) * (1 - smoothstep(0.3, 0.38, p)) * 1.3;
    const wide =
      grindWide +
      smoothstep(0.3, 0.36, p) * (1 - smoothstep(0.49, 0.56, p)) * 0.8 +
      smoothstep(0.72, 0.8, p) * (1 - smoothstep(0.93, 1, p)) * (portrait ? 2.7 : 1.9);
    const dist = baseDist + wide - macro;

    const elevation =
      smoothstep(0.06, 0.2, p) * (1 - smoothstep(0.62, 0.72, p)) * 0.7 +
      smoothstep(0.74, 0.84, p) * 0.55;

    camera.position.set(Math.cos(azimuth) * dist, focusY + 0.5 + elevation, Math.sin(azimuth) * dist);
    // En escritorio el texto va a la izquierda: se desplaza la escena hacia la derecha.
    // En vertical se sube la escena para dejar libre la franja inferior, donde va el texto.
    camera.lookAt(0, focusY + 0.16 - (portrait ? 1.3 : 0), portrait ? 0 : 0.88);
  });
  return null;
}

/* ═══════════════════════════ ESCENA ═══════════════════════════ */

export interface HeroSceneProps {
  scrollProgress?: MotionValue<number>;
}

export function HeroScene({ scrollProgress }: HeroSceneProps = {}) {
  const fallbackProgress = useMotionValue(0.88);
  const progress = scrollProgress ?? fallbackProgress;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  const quality = useMemo(() => (mobile ? MOBILE_QUALITY : DESKTOP_QUALITY), [mobile]);

  // Móvil = pantalla angosta o puntero táctil.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Ahorro de batería: no se dibuja nada mientras la escena no está en pantalla.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <QualityContext.Provider value={quality}>
        <Canvas
          frameloop={active ? "always" : "never"}
          dpr={dpr}
          camera={{ position: [6.6, 0.5, 0], fov: 35, near: 0.1, far: 60 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          onCreated={({ gl, scene }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
            if (process.env.NODE_ENV !== "production") {
              const w = window as unknown as { __heroGl?: THREE.WebGLRenderer; __heroScene?: THREE.Scene };
              w.__heroGl = gl;
              w.__heroScene = scene;
            }
          }}
        >
          {/* Si el dispositivo va justo de FPS, baja la resolución sola. */}
          <PerformanceMonitor flipflops={3} onDecline={() => setDpr([0.8, 1])} />

          {/* Luz base + una direccional. Sin sombras en tiempo real (caras en móvil). */}
          <hemisphereLight args={["#fff1de", "#2a1208", 0.4]} />
          <directionalLight position={[5, 8, 6]} intensity={2.1} color="#fff0dc" />

          {/* Entorno generado por código (sin descargar ningún HDR): tres "softboxes". */}
          <Environment resolution={256} frames={1} environmentIntensity={0.9}>
            {/* Fondo oscuro cálido + "tiras" de luz verticales alrededor: cada faceta de un
                objeto metálico refleja una tira distinta y se ve brillo/sombra alternados,
                como el aluminio real bajo luz de estudio. */}
            <color attach="background" args={["#4a3c31"]} />
            <Lightformer form="rect" intensity={5} color="#fff4e4" position={[4, 5, 6]} scale={[5, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={3} color="#ffa564" position={[-6, 2, -4]} scale={[5, 9, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={2} color="#ffe2c0" position={[0, 7, -2]} scale={5} target={[0, 0, 0]} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <Lightformer
                  key={i}
                  form="rect"
                  intensity={i % 2 === 0 ? 2.6 : 1.1}
                  color={i % 2 === 0 ? "#f3e8da" : "#cdbfb0"}
                  position={[Math.cos(a) * 9, 0.5, Math.sin(a) * 9]}
                  scale={[1.6, 9, 1]}
                  target={[0, 0, 0]}
                />
              );
            })}
          </Environment>

          <CameraRig progress={progress} />
          <BeansStation progress={progress} />
          <GrinderStation progress={progress} />
          <GroundsFlow progress={progress} />
          <MokaStation progress={progress} />
          <Suspense fallback={null}>
            <CupStation progress={progress} />
          </Suspense>
        </Canvas>
      </QualityContext.Provider>
    </div>
  );
}
