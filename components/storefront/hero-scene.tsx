"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { useMotionValue, type MotionValue } from "motion/react";
import { mokaState } from "./hero3d/pour";
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
    const needW = lerp(3.4, 2.3, smoothstep(0.08, 0.3, p)) + smoothstep(0.7, 0.76, p) * 2.2;
    const fitDist = needW / aspect / (2 * Math.tan((fov * Math.PI) / 360));
    // En vertical, entre la molienda y el armado la cámara sigue a la moka real (que baja del molino a la hornilla).
    const follow = portrait && mokaState.centerY > -900 ? smoothstep(0.47, 0.51, p) * (1 - smoothstep(0.62, 0.68, p)) : 0;
    const focusY = lerp(shot.focusY, mokaState.centerY + 0.9, follow);
    // Durante la molienda caben a la vez la salida del molino, el chorro de café y el filtro (~4.4 u),
    // y solo se dispone de ~60 % de la altura (abajo va el texto).
    const needH = 5.0 * (smoothstep(0.4, 0.45, p) * (1 - smoothstep(0.5, 0.55, p)));
    const fitH = needH / 0.6 / (2 * Math.tan((fov * Math.PI) / 360));
    const baseDist = shot.dist * 1.35;
    const dist0 = portrait ? Math.max(baseDist, fitDist, fitH) : shot.dist;
    const dist = portrait ? lerp(dist0, Math.max(dist0, 10.5), follow) : dist0;
    // Durante la molienda se sube más el encuadre: la moka queda sobre la franja de texto y no debajo de ella.
    const grindLift = smoothstep(0.37, 0.42, p) * (1 - smoothstep(0.52, 0.58, p)) * 1.6;
    const lift = portrait ? 1.45 * (dist / baseDist) + grindLift : 0;
    cam.fov = fov;
    cam.updateProjectionMatrix();

    // Respiración de "cámara en mano": movimiento mínimo para dar vida.
    const sway = Math.sin(t * 0.35) * 0.012;
    const azim = shot.azim + sway;
    cam.position.set(Math.cos(azim) * dist, focusY + shot.elev + 0.25, Math.sin(azim) * dist);
    // En escritorio el texto va a la izquierda: se desplaza la escena hacia la derecha.
    // En vertical se sube la escena para dejar libre la franja inferior del texto.
    cam.lookAt(0, focusY - lerp(lift, 1.9, follow), portrait ? 0 : 0.88);
  });
  return null;
}

/**
 * Precalentamiento: three.js compila cada shader y sube cada textura la PRIMERA vez que algo se dibuja.
 * Como muchos objetos de la historia están ocultos hasta su turno (llama, café, taza, fondo de cafetería),
 * ese trabajo caía en pleno scroll y producía tirones de 70–150 ms. Aquí se hace una vez, al terminar de cargar:
 * se marcan todos visibles un instante, se compilan los programas y las texturas se suben una por una en pausas
 * cortas para no bloquear un solo cuadro.
 */
function Warmup() {
  const gl = useThree((st) => st.gl);
  const scene = useThree((st) => st.scene);
  const camera = useThree((st) => st.camera);
  const { active, progress } = useProgress();
  const started = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (active || progress < 100 || started.current) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || started.current) return;
      started.current = true;
      const flags: [THREE.Object3D, boolean][] = [];
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        flags.push([o, o.visible]);
        o.visible = true;
        const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => {
          Object.values(m).forEach((v) => {
            if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture);
          });
        });
      });
      // Los programas se recogen de forma síncrona y se compilan en paralelo (no bloquea).
      const compiled = gl.compileAsync(scene, camera).catch(() => {});
      flags.forEach(([o, v]) => (o.visible = v));
      // Cuando los programas están listos se dibuja UN fotograma con todo visible: así la geometría de cada pieza
      // (taza, bizcochos, montículo, fondo) ya está en la GPU y no se sube a mitad del scroll.
      void compiled.then(() => {
        if (!alive.current) return;
        const saved: [THREE.Object3D, boolean][] = [];
        scene.traverse((o) => {
          saved.push([o, o.visible]);
          o.visible = true;
        });
        try {
          gl.render(scene, camera);
        } catch {}
        saved.forEach(([o, v]) => (o.visible = v));
      });
      const queue = [...textures];
      const step = () => {
        const tex = queue.pop();
        if (!tex || !alive.current) return;
        try {
          gl.initTexture(tex);
        } catch {}
        window.setTimeout(step, 40);
      };
      step();
    }, 600);
    const again = window.setTimeout(() => {
      if (!alive.current) return;
      gl.compileAsync(scene, camera).catch(() => {});
      scene.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) =>
          Object.values(m).forEach((v) => {
            if (v && (v as THREE.Texture).isTexture) {
              try {
                gl.initTexture(v as THREE.Texture);
              } catch {}
            }
          }),
        );
      });
    }, 4000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(again);
    };
  }, [active, progress, gl, scene, camera]);

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
            <color attach="background" args={["#1d140e"]} />
            <Lightformer form="rect" intensity={5} color="#fff4e4" position={[4, 5, 6]} scale={[5, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={3} color="#ffa564" position={[-6, 2, -4]} scale={[5, 9, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={2} color="#ffe2c0" position={[0, 7, -2]} scale={5} target={[0, 0, 0]} />
            {/* Gran softbox frontal (detrás de la cámara): las caras que miran al espectador nunca quedan negras. */}
            <Lightformer form="rect" intensity={0.9} color="#efe6da" position={[9, 1, 0]} scale={[10, 8, 1]} target={[0, 0, 0]} />
            {/* Luz de rebote desde la mesa/hornilla: sin ella las caras inferiores del metal salen negras */}
            <Lightformer form="rect" intensity={1.6} color="#d9b48a" position={[0, -6, 0]} scale={[14, 14, 1]} target={[0, 0, 0]} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <Lightformer
                  key={i}
                  form="rect"
                  intensity={i % 2 === 0 ? 4.2 : 0.5}
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
          <Warmup />
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
