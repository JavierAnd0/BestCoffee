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

// Three.js cannot SSR — defer to client. Until the canvas is ready the panel
// stays dark, then the model fades in (handled by the model's own Suspense).
const HeroModel = dynamic(
  () => import("./hero-model").then((m) => m.HeroModel),
  { ssr: false, loading: () => null },
);

/* ═══════════════════════════════════════════════════════════
   TEXT PHASE — symmetric in/out with blur + lift, generous
   overlap so the screen is never empty between phases.
   ═══════════════════════════════════════════════════════════ */
function TextPhase({
  progress,
  inAt,
  outAt,
  lift = 26,
  children,
  className = "",
}: {
  progress: MotionValue<number>;
  inAt: number;
  outAt: number;
  lift?: number;
  children: React.ReactNode;
  className?: string;
}) {
  // Fade window: ramp up over the first 35% of the phase, hold, ramp down
  // over the last 35%. Wider ramps = softer, more cinematic crossfades.
  const span = outAt - inAt;
  const inEnd = inAt + span * 0.34;
  const outStart = outAt - span * 0.34;

  const opacity = useTransform(
    progress,
    [inAt, inEnd, outStart, outAt],
    [0, 1, 1, 0],
  );
  // Enter from below, exit upward — a continuous drift, never a snap back.
  const y = useTransform(
    progress,
    [inAt, inEnd, outStart, outAt],
    [lift, 0, 0, -lift * 0.7],
  );
  const blur = useTransform(
    progress,
    [inAt, inEnd, outStart, outAt],
    [8, 0, 0, 6],
  );
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      style={{ opacity, y, filter, willChange: "opacity, transform, filter" }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCROLL STORY — cinematic scroll experience.

   Design principles for the "premium" feel:
   • The 3D model rotates CONTINUOUSLY on its own (inside HeroModel),
     decoupled from scroll — so motion never freezes when the user stops.
   • Scroll drives only position / scale / opacity, and is smoothed through
     a spring so micro scroll jitter becomes buttery glide.
   • Text phases cross-fade with wide overlapping windows + blur, so there's
     never an empty frame and never a hard cut.
   ═══════════════════════════════════════════════════════════ */
export function ScrollStory({ content }: { content: HeroContent }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ── Spring-smoothed progress: the single biggest lever for a premium feel.
  // Critically damped-ish so it glides without overshoot wobble.
  const p = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.00015,
    mass: 0.9,
  });

  /* ── Cup choreography — stays CENTERED horizontally the whole time. Only
       a small vertical lift + scale breathing; no drift to the sides. The
       model spins itself (sway) and steams itself, both inside the canvas. ── */
  // Sits a touch below center during the brand title (so the title owns the
  // screen), rises to its hero spot as the title leaves, then a gentle
  // upward exit. Always horizontally centered.
  const cupY = useTransform(
    p,
    [0, 0.1, 0.24, 0.9, 1],
    [90, 46, -28, -28, -70],
  );
  const cupOpacity = useTransform(p, [0, 0.06, 0.98, 1], [0, 1, 1, 0.92]);
  const cupScale = useTransform(
    p,
    [0, 0.1, 0.24, 0.9, 1],
    [0.55, 0.72, 1, 1, 0.92],
  );
  // Horizontal stays at 0 — centered. (No cupX drift.)
  // Subtle parallax tilt only, for life without displacement.
  const cupTilt = useTransform(p, [0, 0.5, 1], [-2.5, 0, 2.5]);

  /* ── Background: deep roast → warm cream, eased across the last third. ── */
  const lightOverlayOpacity = useTransform(p, [0, 0.58, 0.82, 1], [0, 0, 0.78, 1]);
  // Vignette tightens slightly through the middle for depth, then releases.
  const vignetteOpacity = useTransform(p, [0, 0.3, 0.7, 1], [0.5, 0.7, 0.55, 0.2]);

  /* ── Scroll cue fades the moment the user engages. ── */
  const scrollCueOpacity = useTransform(p, [0, 0.05], [1, 0]);

  const lines = content.title.split("\n");

  return (
    /* ── Tall scroll-driver section ── */
    <div ref={containerRef} style={{ height: "520vh" }}>

      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 h-[100svh] overflow-hidden flex items-center justify-center">

        {/* ── Deep roast background ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg,#0a0401 0%,#1c0905 44%,#301208 100%)",
          }}
        />

        {/* ── Warm cream overlay that bleeds in near the CTA ── */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: lightOverlayOpacity, background: "var(--background)" }}
        />

        {/* ── Vignette for depth ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: vignetteOpacity,
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgba(8,3,1,0.9) 100%)",
          }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "var(--grain)", backgroundSize: "200px", opacity: 0.045 }}
        />

        {/* ════════ TEXT PHASES ════════ */}

        {/* Phase 0 — Brand entrance (2–22%) */}
        <TextPhase
          progress={p}
          inAt={0.02} outAt={0.22}
          className="inset-0 flex flex-col items-center justify-center text-white text-center px-6 pointer-events-none"
          lift={16}
        >
          <p className="eyebrow text-white/45 tracking-[0.3em] mb-6">{content.eyebrow}</p>
          <h1
            className="font-display font-light leading-[0.88] tracking-tight"
            style={{
              fontSize: "clamp(3.8rem,10vw,8.5rem)",
              textShadow: "0 4px 60px rgba(0,0,0,0.5)",
            }}
          >
            {lines.map((l, i) => <span key={i} className="block">{l}</span>)}
          </h1>
        </TextPhase>

        {/* Phase 1 — Left: origin / Right: profile (22–46%) */}
        <TextPhase
          progress={p}
          inAt={0.22} outAt={0.46}
          className="left-6 sm:left-10 lg:left-20 xl:left-28 top-1/2 -translate-y-1/2 text-white pointer-events-none"
          lift={20}
        >
          <p className="eyebrow text-white/40 mb-3">Origen</p>
          <p className="font-display font-light text-[clamp(1.8rem,3.5vw,3rem)] leading-tight text-white/92">
            Colombia
          </p>
          <p className="mt-2 text-sm text-white/50 font-light">1.800m de altura</p>
          <div className="mt-4 w-8 h-px" style={{ background: "rgba(255,255,255,0.22)" }} />
          <p className="mt-4 text-xs text-white/40 font-light leading-relaxed max-w-[150px]">
            Microlotes seleccionados<br />de fincas familiares
          </p>
        </TextPhase>

        <TextPhase
          progress={p}
          inAt={0.22} outAt={0.46}
          className="right-6 sm:right-10 lg:right-20 xl:right-28 top-1/2 -translate-y-1/2 text-white pointer-events-none text-right"
          lift={20}
        >
          <p className="eyebrow text-white/40 mb-3">Perfil de taza</p>
          <p className="font-display font-light text-[clamp(1.8rem,3.5vw,3rem)] leading-tight text-white/92">
            Origen<br />único
          </p>
          <p className="mt-2 text-sm text-white/50 font-light">Chocolatado · Cítrico</p>
          <div className="mt-4 w-8 h-px ml-auto" style={{ background: "rgba(255,255,255,0.22)" }} />
          <p className="mt-4 text-xs text-white/40 font-light leading-relaxed max-w-[150px] ml-auto">
            Tueste medio<br />en lotes pequeños
          </p>
        </TextPhase>

        {/* Phase 2 — Main tagline below cup (46–66%) */}
        <TextPhase
          progress={p}
          inAt={0.46} outAt={0.66}
          className="inset-x-0 bottom-[15%] sm:bottom-[17%] px-6 text-center text-white pointer-events-none"
          lift={26}
        >
          <p
            className="font-display mx-auto leading-[1.32] max-w-[26rem] sm:max-w-xl"
            style={{
              fontSize: "clamp(1.3rem,2.5vw,2.15rem)",
              fontWeight: 400,
              textShadow: "0 2px 50px rgba(0,0,0,0.65)",
            }}
          >
            {content.subtitle}
          </p>
        </TextPhase>

        {/* Phase 3 — Freshness promise (66–84%) */}
        <TextPhase
          progress={p}
          inAt={0.66} outAt={0.84}
          className="inset-x-0 bottom-[15%] sm:bottom-[17%] px-6 text-center text-white pointer-events-none"
          lift={24}
        >
          <p className="eyebrow text-white/45 tracking-[0.26em] mb-4">Frescura garantizada</p>
          <p
            className="font-display leading-[1.18]"
            style={{
              fontSize: "clamp(1.5rem,3.2vw,2.6rem)",
              fontWeight: 400,
              textShadow: "0 2px 50px rgba(0,0,0,0.65)",
            }}
          >
            Tostado esta semana.<br />En tu puerta mañana.
          </p>
        </TextPhase>

        {/* Phase 4 — CTA (84–100%): cup drifts right, text resolves on the left */}
        <TextPhase
          progress={p}
          inAt={0.84} outAt={1.0}
          className="left-6 sm:left-10 lg:left-20 xl:left-28 top-1/2 -translate-y-[55%] pointer-events-auto"
          lift={28}
        >
          <p className="eyebrow text-foreground/50 mb-5 tracking-[0.24em]">Café de especialidad</p>
          <h2
            className="font-display font-light leading-[0.92] tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.4rem,5vw,4.25rem)" }}
          >
            Descubre<br />tu origen.
          </h2>
          <div className="mt-10 flex flex-col gap-4">
            <Link
              href={content.ctaPrimaryHref}
              className="group inline-flex items-center gap-3 text-sm font-medium tracking-wide border-b border-foreground/25 pb-1 hover:border-foreground transition-colors w-fit"
            >
              {content.ctaPrimaryLabel}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            {content.ctaSecondaryHref && (
              <Link
                href={content.ctaSecondaryHref}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                {content.ctaSecondaryLabel}
              </Link>
            )}
          </div>
        </TextPhase>

        {/* ════════ THE 3D CUP ════════ */}
        <motion.div
          className="relative z-20"
          style={{
            y: cupY,
            opacity: cupOpacity,
            scale: cupScale,
            rotate: cupTilt,
            willChange: "transform, opacity",
          }}
        >
          {/* The model sways + steams inside its own canvas; the canvas is
              taller than the cup so the rising steam isn't clipped. */}
          <div className="relative w-[260px] h-[360px] sm:w-[320px] sm:h-[440px] lg:w-[380px] lg:h-[520px]">
            <HeroModel autoRotateSpeed={0.3} floatIntensity={0.32} />
          </div>
        </motion.div>

        {/* ── Scroll cue ── */}
        <motion.div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: scrollCueOpacity }}
          aria-hidden="true"
        >
          <span className="eyebrow text-white/35">Scroll</span>
          <motion.div
            className="w-px h-8 bg-white/25"
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.2, 0.65, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originY: 0 }}
          />
        </motion.div>

      </div>
    </div>
  );
}
