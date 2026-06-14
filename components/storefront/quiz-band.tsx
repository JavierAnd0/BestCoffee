"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function QuizBand() {
  return (
    <section
      className="overflow-hidden"
      style={{ backgroundColor: "var(--cream-mid)" }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-24">

        {/* ── Thin top rule ── */}
        <div className="w-full h-px mb-12 lg:mb-16" style={{ background: "var(--line-strong)" }} />

        <div className="grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-16 xl:gap-20 items-end">

          {/* ── Giant "5" — pure typographic design element ── */}
          <motion.div
            className="select-none leading-none font-display font-light"
            style={{
              fontSize: "clamp(9rem, 22vw, 18rem)",
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(23,13,4,0.14)",
              lineHeight: 0.85,
            }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            5
          </motion.div>

          {/* ── Editorial question text ── */}
          <motion.div
            className="pb-2 lg:pb-4"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <span className="eyebrow block mb-5">Quiz de recomendación</span>

            <h2 className="font-display font-light text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.08] tracking-tight">
              preguntas para<br />
              encontrar tu<br />
              café ideal
            </h2>

            <p className="mt-6 text-sm text-muted-foreground max-w-xs leading-relaxed font-light">
              Te llevamos en menos de un minuto al café que más
              se acerca a tu paladar.
            </p>

            <Link
              href="/quiz"
              className="mt-8 group inline-flex items-center gap-3 text-sm font-medium tracking-wide w-fit border-b border-foreground/25 pb-1 hover:border-foreground transition-colors duration-200"
            >
              Hacer el quiz
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </div>

        {/* ── Thin bottom rule ── */}
        <div className="w-full h-px mt-12 lg:mt-16" style={{ background: "var(--line-strong)" }} />
      </div>
    </section>
  );
}
