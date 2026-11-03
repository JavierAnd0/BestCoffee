"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useMotionValue, type MotionValue } from "motion/react";
import { cameraAt } from "./hero3d/shots";
import { lerp, smoothstep } from "./hero3d/math";
import { Stove } from "./hero3d/stove";
import {
  DESKTOP_QUALITY,
  MOBILE_QUALITY,
  QualityContext,
} from "./hero3d/quality";
import { BeansStation } from "./hero3d/beans";
import { CupStation } from "./hero3d/cup";
import { GrinderStation, GroundsFlow } from "./hero3d/grinder";
import { MokaStation } from "./hero3d/moka";
import { preloadModels } from "./hero3d/assets";

/* ═══════════════════════════ CÁMARA ═══════════════════════════
   La cámara sigue el guion de hero3d/shots.ts (planos clave por scroll).   */

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const size = useThree((st) => st.size);
  const aspect = size.width / size.height;
  const portrait = aspect < 0.9;

  useFrame((state) => {
    const p = progress.get();
    const t = state.clock.elapsedTime;
    const shot = cameraAt(p);
    const cam = state.camera as THREE.PerspectiveCamera;

    // En vertical (móvil) hay poco ancho: se aleja y se abre el campo para que todo quepa.
    const fov = shot.fov + (portrait ? 5 : 0);
    // Ancho de escena que debe caber: el costal y el servido son anchos; el molino y la moka, angostos.
    const needW = lerp(3.4, 2.3, smoothstep(0.08, 0.3, p)) + smoothstep(0.7, 0.8, p) * 1.2;
    const fitDist = needW / aspect / (2 * Math.tan((fov * Math.PI) / 360));
    const dist = portrait ? Math.max(shot.dist * 1.35, fitDist) : shot.dist;
    cam.fov = fov;
    cam.updateProjectionMatrix();

    // Respiración de "cámara en mano": movimiento mínimo para dar vida.
    const sway = Math.sin(t * 0.35) * 0.012;
    const azim = shot.azim + sway;
    cam.position.set(Math.cos(azim) * dist, shot.focusY + shot.elev + 0.25, Math.sin(azim) * dist);
    // En escritorio el texto va a la izquierda: se desplaza la escena hacia la derecha.
    // En vertical se sube la escena para dejar libre la franja inferior del texto.
    cam.lookAt(0, shot.focusY - (portrait ? 1.45 : 0), portrait ? 0 : 0.88);
  });
  return null;
}

/** Contraluz cálido que sigue a la cámara: separa los objetos del fondo (look de estudio). */
function RimLight({ progress }: { progress: MotionValue<number> }) {
  const light = useRef<THREE.SpotLight>(null);
  useFrame((state) => {
    const l = light.current;
    if (!l) return;
    const shot = cameraAt(progress.get());
    l.position.set(-4.5, shot.focusY + 3.2, -5.5);
    l.target.position.set(0, shot.focusY, 0);
    l.target.updateMatrixWorld();
    // al final (fondo crema) el contraluz baja para no lavar la taza
    l.intensity = 38 * (1 - smoothstep(0.82, 1, progress.get()) * 0.55);
    void state;
  });
  return <spotLight ref={light} color="#ffb070" angle={0.55} penumbra={0.9} distance={26} decay={1.6} />;
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
          camera={{ position: [5, 1.5, 0], fov: 33, near: 0.1, far: 60 }}
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
          <hemisphereLight args={["#fff1de", "#3a2014", 0.55]} />
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
            {/* Gran softbox frontal (detrás de la cámara): las caras que miran al espectador nunca quedan negras. */}
            <Lightformer form="rect" intensity={1.7} color="#efe6da" position={[9, 1, 0]} scale={[10, 8, 1]} target={[0, 0, 0]} />
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

          <fog attach="fog" args={["#1c0d06", 14, 38]} />
          <RimLight progress={progress} />
          <CameraRig progress={progress} />
          <Suspense fallback={null}>
            <BeansStation progress={progress} />
          </Suspense>
          <Suspense fallback={null}>
            <GrinderStation progress={progress} />
          </Suspense>
          <GroundsFlow progress={progress} />
          <Stove progress={progress} />
          <Suspense fallback={null}>
            <MokaStation progress={progress} />
          </Suspense>
          <Suspense fallback={null}>
            <CupStation progress={progress} />
          </Suspense>
        </Canvas>
      </QualityContext.Provider>
    </div>
  );
}

preloadModels();
