"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import type { HeroContent } from "@/lib/types";

// Three.js cannot SSR — defer to client.
const HeroModel = dynamic(
  () => import("./hero-model").then((m) => m.HeroModel),
  { ssr: false, loading: () => null },
);

/* ═══════════════════════════════════════════════════════════
   STATION TEXT — Editorial floating copy synchronized with
   the 4 vertical 3D stations. Pure GPU opacity + translateY.
   ═══════════════════════════════════════════════════════════ */
function StationCard({
  progress,
  inAt,
  outAt,
  stayIn = false,
  stayOut = false,
  interactive = false,
  children,
}: {
  progress: MotionValue<number>;
  inAt: number;
  outAt: number;
  stayIn?: boolean;
  stayOut?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const span = outAt - inAt;
  const inEnd = stayIn ? inAt : inAt + span * 0.24;
  const outStart = stayOut ? outAt : outAt - span * 0.24;

  const opacity = useTransform(
    progress,
    [inAt, inEnd, outStart, outAt],
    [stayIn ? 1 : 0, 1, 1, stayOut ? 1 : 0],
  );

  const y = useTransform(
    progress,
    [inAt, inEnd, outStart, outAt],
    [stayIn ? 0 : 36, 0, 0, stayOut ? 0 : -36],
  );

  const pointerEvents = useTransform(opacity, (v) =>
    interactive && v > 0.45 ? "auto" : "none",
  );

  return (
    <motion.div
      style={{
        opacity,
        y,
        pointerEvents,
        willChange: "opacity, transform",
      }}
      className="absolute inset-x-6 sm:inset-x-auto sm:left-10 lg:left-20 xl:left-28 bottom-12 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 max-w-[30rem] z-30"
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION DOT — Right-hand vertical progress indicator
   Adapts cleanly as Station 4 transitions to warm cream.
   ═══════════════════════════════════════════════════════════ */
function StationStepDot({
  progress,
  range,
  label,
  num,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  label: string;
  num: string;
}) {
  const activeOpacity = useTransform(
    progress,
    [
      Math.max(0, range[0] - 0.04),
      range[0] + 0.03,
      range[1] - 0.03,
      Math.min(1, range[1] + 0.04),
    ],
    [0.32, 1, 1, 0.32],
  );
  const barScale = useTransform(
    progress,
    [range[0], range[1]],
    [0, 1],
  );
  const labelColor = useTransform(
    progress,
    [0.75, 0.88],
    ["rgba(247, 239, 228, 0.85)", "rgba(23, 13, 4, 0.82)"],
  );
  const trackBg = useTransform(
    progress,
    [0.75, 0.88],
    ["rgba(247, 239, 228, 0.16)", "rgba(23, 13, 4, 0.14)"],
  );

  return (
    <motion.div
      style={{ opacity: activeOpacity }}
      className="flex items-center justify-end gap-3"
    >
      <motion.span
        style={{ color: labelColor }}
        className="text-[10px] font-mono uppercase tracking-[0.22em]"
      >
        {num} · {label}
      </motion.span>
      <motion.div
        style={{ backgroundColor: trackBg }}
        className="w-1 h-7 rounded-full overflow-hidden relative"
      >
        <motion.div
          className="absolute inset-x-0 top-0 bottom-0 origin-top"
          style={{
            scaleY: barScale,
            backgroundColor: "var(--accent)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCROLL STORY — 4-Station 3D Coffee Ritual (500vh)
   Station 1: El Origen / El Grano (Bag + 64 Instanced Beans)
   Station 2: La Molienda (Conical Burr Grinder + Grounds Stream)
   Station 3: La Alquimia (Bialetti Extraction + Liquid Pour)
   Station 4: El Resultado (Steaming Cup + Rising Crema + CTA)
   ═══════════════════════════════════════════════════════════ */
export function ScrollStory({ content }: { content: HeroContent }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth scrub (equivalent to scrub: 0.5 in GSAP + Lenis)
  const p = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.5,
    restDelta: 0.0004,
  });

  // Seamless transition from Warm Espresso Roast (Stations 1–3)
  // to the storefront's Warm Cream/Ivory palette in Station 4
  const creamStageOpacity = useTransform(p, [0.74, 0.89], [0, 1]);
  const darkVignetteOpacity = useTransform(p, [0.72, 0.88], [1, 0]);
  const scrollCueOpacity = useTransform(p, [0, 0.05], [1, 0]);

  return (
    /* ── 500vh scroll driver ── */
    <div
      ref={containerRef}
      style={{ height: "500vh", backgroundColor: "#110602" }}
    >
      {/* ── Sticky full-viewport stage ── */}
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 64% 48%, #341509 0%, #1c0904 52%, #0d0401 100%)",
          color: "#f7efe4",
        }}
      >
        {/* ── Warm terracotta & crema studio backlight behind the 3D rail ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: darkVignetteOpacity,
            background:
              "radial-gradient(circle 540px at 63% 48%, rgba(184, 92, 50, 0.26) 0%, rgba(212, 165, 116, 0.10) 45%, transparent 75%)",
          }}
        />

        {/* ── Station 4 Editorial Warm Cream background transition ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            opacity: creamStageOpacity,
            background:
              "radial-gradient(ellipse 80% 75% at 64% 50%, #fffdf9 0%, #faf7f1 58%, #f2ece1 100%)",
          }}
        />

        {/* ── Subtle analog film grain from globals.css ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: "var(--grain)",
            backgroundSize: "180px 180px",
          }}
        />

        {/* ── Fullscreen 3D Canvas Stage (4 Stations along vertical Y rail) ── */}
        <div className="absolute inset-0 z-10">
          <HeroModel scrollProgress={p} />
        </div>

        {/* ── Warm espresso vignette (fades out as Station 4 opens into cream) ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            opacity: darkVignetteOpacity,
            background:
              "radial-gradient(ellipse 75% 70% at 62% 50%, transparent 48%, rgba(11, 4, 1, 0.72) 100%)",
          }}
        />

        {/* ════════ 4 STATIONS FLOATING TEXT (EDITORIAL KINFOLK STYLE) ════════ */}

        {/* ESTACIÓN 1: El Grano (0% a 23%) */}
        <StationCard progress={p} inAt={0} outAt={0.23} stayIn>
          <span
            className="inline-flex items-center gap-2.5 text-xs font-mono font-medium tracking-[0.22em] uppercase"
            style={{ color: "#e09f67" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--accent)" }}
            />
            01. El Origen · {content.eyebrow}
          </span>
          <h1
            className="font-display font-light text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.95] tracking-tight mt-3"
            style={{ color: "#fbf6ee" }}
          >
            Seleccionado
            <br />
            <em className="italic font-normal" style={{ color: "#e8b888" }}>
              grano a grano.
            </em>
          </h1>
          <p
            className="mt-4 text-base sm:text-lg font-light leading-relaxed max-w-md"
            style={{ color: "rgba(244, 232, 217, 0.78)" }}
          >
            Tostión media en lotes pequeños que preserva las notas
            achocolatadas y la acidez brillante de los 1.800 m de altura.
          </p>
          <div
            className="mt-6 flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.18em]"
            style={{ color: "rgba(224, 159, 103, 0.72)" }}
          >
            <span>Cordillera Central</span>
            <span>·</span>
            <span>SCA 86.5 pts</span>
          </div>
        </StationCard>

        {/* ESTACIÓN 2: El Molino (25% a 48%) */}
        <StationCard progress={p} inAt={0.25} outAt={0.48}>
          <span
            className="inline-flex items-center gap-2.5 text-xs font-mono font-medium tracking-[0.22em] uppercase"
            style={{ color: "#e09f67" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
            02. La Molienda
          </span>
          <h2
            className="font-display font-light text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.95] tracking-tight mt-3"
            style={{ color: "#fbf6ee" }}
          >
            Molienda fresca
            <br />
            <em className="italic font-normal" style={{ color: "#e8b888" }}>
              al instante.
            </em>
          </h2>
          <p
            className="mt-4 text-base sm:text-lg font-light leading-relaxed max-w-md"
            style={{ color: "rgba(244, 232, 217, 0.78)" }}
          >
            El grano recién tostado ingresa al molino manual; sus muelas cónicas
            giran en frío liberando una molienda uniforme directa al filtro.
          </p>
          <div
            className="mt-6 flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.18em]"
            style={{ color: "rgba(224, 159, 103, 0.72)" }}
          >
            <span>Corte en frío</span>
            <span>·</span>
            <span>Granulometría precisa</span>
          </div>
        </StationCard>

        {/* ESTACIÓN 3: La Cafetera / Armado y Extracción (50% a 73%) */}
        <StationCard progress={p} inAt={0.5} outAt={0.73}>
          <span
            className="inline-flex items-center gap-2.5 text-xs font-mono font-medium tracking-[0.22em] uppercase"
            style={{ color: "#e09f67" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
            03. La Alquimia Moka
          </span>
          <h2
            className="font-display font-light text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.95] tracking-tight mt-3"
            style={{ color: "#fbf6ee" }}
          >
            Del embudo al
            <br />
            <em className="italic font-normal" style={{ color: "#e8b888" }}>
              cuerpo perfecto.
            </em>
          </h2>
          <p
            className="mt-4 text-base sm:text-lg font-light leading-relaxed max-w-md"
            style={{ color: "rgba(244, 232, 217, 0.78)" }}
          >
            El café molido reposa en el embudo de aluminio antes de sellar la
            cafetera pieza a pieza para extraer una infusión intensa y sedosa.
          </p>
          <div
            className="mt-6 flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.18em]"
            style={{ color: "rgba(224, 159, 103, 0.72)" }}
          >
            <span>Sellado hermético</span>
            <span>·</span>
            <span>Extracción a presión</span>
          </div>
        </StationCard>

        {/* ESTACIÓN 4: La Taza / El Resultado (76% hasta el final — sobre crema editorial) */}
        <StationCard
          progress={p}
          inAt={0.76}
          outAt={1.0}
          stayOut
          interactive
        >
          <span
            className="inline-flex items-center gap-2.5 text-xs font-mono font-semibold tracking-[0.22em] uppercase"
            style={{ color: "var(--accent)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
            />
            04. El Resultado
          </span>
          <h2
            className="font-display font-light text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.95] tracking-tight mt-3"
            style={{ color: "var(--foreground)" }}
          >
            Tu taza perfecta
            <br />
            <em
              className="italic font-normal"
              style={{ color: "var(--accent)" }}
            >
              está lista.
            </em>
          </h2>
          <p
            className="mt-4 text-base sm:text-lg font-light leading-relaxed max-w-md"
            style={{ color: "var(--muted)" }}
          >
            {content.subtitle} Tostado esta semana, en tu puerta mañana.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href={content.ctaPrimaryHref}
              className="group inline-flex items-center gap-3 px-7 py-4 text-xs uppercase tracking-[0.18em] font-semibold rounded-full transition-all duration-300 shadow-lg hover:scale-[1.02]"
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              {content.ctaPrimaryLabel}
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            {content.ctaSecondaryHref && (
              <Link
                href={content.ctaSecondaryHref}
                className="text-sm transition-colors font-normal border-b pb-0.5"
                style={{
                  color: "var(--foreground)",
                  borderColor: "var(--border-strong)",
                }}
              >
                {content.ctaSecondaryLabel}
              </Link>
            )}
          </div>
        </StationCard>

        {/* ── Right-side Vertical Station Rail HUD ── */}
        <div
          className="hidden md:flex flex-col gap-4 absolute right-8 lg:right-12 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
          aria-hidden="true"
        >
          <StationStepDot
            progress={p}
            range={[0.0, 0.25]}
            num="01"
            label="El Grano"
          />
          <StationStepDot
            progress={p}
            range={[0.25, 0.5]}
            num="02"
            label="El Molino"
          />
          <StationStepDot
            progress={p}
            range={[0.5, 0.75]}
            num="03"
            label="El Método"
          />
          <StationStepDot
            progress={p}
            range={[0.75, 1.0]}
            num="04"
            label="La Taza"
          />
        </div>

        {/* ── Initial Scroll Cue ── */}
        <motion.div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30"
          style={{ opacity: scrollCueOpacity }}
          aria-hidden="true"
        >
          <span
            className="text-[10px] font-mono uppercase tracking-[0.26em]"
            style={{ color: "rgba(244, 232, 217, 0.65)" }}
          >
            Iniciar preparación
          </span>
          <motion.div
            className="w-px h-8"
            style={{ backgroundColor: "var(--accent)", originY: 0 }}
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
