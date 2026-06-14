"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import type { HeroContent } from "@/lib/types";

// Three.js cannot render on the server — load only on client. While the
// canvas isn't mounted yet, the ImagePanel gradient still shows underneath.
const HeroModel = dynamic(
  () => import("./hero-model").then((m) => m.HeroModel),
  { ssr: false, loading: () => null },
);

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

function appear(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, ease: EASE, delay },
  } as const;
}

/* ── Word variants use tupled ease ── */
const wordContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.048, delayChildren: 0.1 } },
} as const;

const wordItem = {
  hidden: { y: "108%", opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.85, ease: EASE },
  },
} as const;

/* ── Warm editorial image panel ── */
function ImagePanel() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(158deg,#2a1409 0%,#4a2212 28%,#7a3c20 55%,#a86030 75%,#c8874a 92%,#dba86a 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 38% 52%, rgba(210,150,70,0.22) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.05]"
        style={{ backgroundImage: "var(--grain)", backgroundSize: "200px" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 38%, rgba(10,4,1,0.5) 100%)",
        }}
      />
    </div>
  );
}

/* ── Hero ── */
export function Hero({ content }: { content: HeroContent }) {
  const lines = content.title.split("\n");
  const totalWords = lines.reduce((n, l) => n + l.split(" ").length, 0);
  const afterTitle = 0.1 + totalWords * 0.048 + 0.2;

  return (
    <section className="relative flex flex-col min-h-[92svh]" aria-label="Hero principal">
      <div className="flex-1 grid lg:grid-cols-[1fr_42%]">

        {/* ── Text side ── */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-16 pb-12 lg:py-20">

          {/* Eyebrow + rule */}
          <motion.div
            className="flex items-center gap-4 mb-10 lg:mb-14"
            {...appear(0)}
          >
            <span className="eyebrow">{content.eyebrow}</span>
            <div className="h-px w-16" style={{ background: "var(--line-strong)" }} />
          </motion.div>

          {/* ── Title: word-by-word reveal ── */}
          <motion.h1
            className="font-display font-light leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(3.5rem,8vw,6.75rem)" }}
            variants={wordContainer}
            initial="hidden"
            animate="show"
          >
            {lines.map((line, li) => (
              <span key={li} className="block">
                {line.split(" ").map((word, wi, arr) => (
                  <span
                    key={wi}
                    className="inline-block overflow-hidden"
                    style={{ verticalAlign: "bottom" }}
                  >
                    <motion.span className="inline-block" variants={wordItem}>
                      {word}
                      {wi < arr.length - 1 && <span className="inline-block w-[0.26em]" />}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          {/* Accent rule */}
          <motion.div
            className="mt-8 lg:mt-10 w-14 h-px bg-accent/55"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ originX: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: afterTitle }}
          />

          {/* Subtitle */}
          {content.subtitle && (
            <motion.p
              className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-[18rem] font-light"
              {...appear(afterTitle + 0.1)}
            >
              {content.subtitle}
            </motion.p>
          )}

          {/* CTAs — editorial text links */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-6"
            {...appear(afterTitle + 0.25)}
          >
            <Link
              href={content.ctaPrimaryHref}
              className="group relative inline-flex items-center gap-2.5 text-sm font-medium tracking-wide"
            >
              {content.ctaPrimaryLabel}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              <span className="absolute bottom-[-2px] left-0 w-full h-px bg-foreground" />
            </Link>

            {content.ctaSecondaryLabel && content.ctaSecondaryHref && (
              <Link
                href={content.ctaSecondaryHref}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                {content.ctaSecondaryLabel}
              </Link>
            )}
          </motion.div>
        </div>

        {/* ── Image side — bleeds to right edge ── */}
        <div className="relative hidden lg:block overflow-hidden">
          {/* Gradient panel stays as the warm backdrop the 3D model floats over */}
          <ImagePanel />
          {/* Canvas mounted on top — alpha:true so the gradient shows through */}
          <HeroModel />
          {/* Fade into background colour */}
          <div
            className="absolute inset-y-0 left-0 w-28 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right,var(--background),transparent)" }}
          />
        </div>
      </div>

      {/* ── Metadata bar ── */}
      <motion.div
        className="border-t border-line px-6 sm:px-10 lg:px-16 xl:px-24 py-4"
        {...appear(afterTitle + 0.45)}
      >
        <div className="flex flex-wrap gap-6 lg:gap-10">
          {["Colombia", "1.800 m de altura", "Lotes pequeños", "Enviado fresco"].map((item) => (
            <span key={item} className="eyebrow opacity-55">{item}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
