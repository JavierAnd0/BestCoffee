"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Roast } from "@/components/ui/roast";
import { formatCop } from "@/lib/format";
import type { SpotlightContent } from "@/lib/types";

function SpotlightImage({ alt }: { alt: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(155deg,#0c0503 0%,#281108 32%,#502516 60%,#7e3d25 80%,#a86238 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 38%, rgba(195,140,65,0.2) 0%, transparent 58%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.048]"
        style={{ backgroundImage: "var(--grain)", backgroundSize: "200px" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(5,2,1,0.52) 100%)",
        }}
      />
      <div
        className="absolute inset-0 grid place-items-center text-[11px] text-white/12 tracking-widest uppercase select-none"
      >
        {alt}
      </div>
    </div>
  );
}

export function Spotlight({ content }: { content: SpotlightContent }) {
  return (
    <section className="overflow-hidden bg-background">
      <div className="grid lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr]">

        {/* ── Text — left side ── */}
        <motion.div
          className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-24"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="eyebrow mb-5">{content.eyebrow}</span>

          <h2 className="font-display font-light text-[clamp(2.2rem,4vw,3.25rem)] leading-tight tracking-tight">
            {content.title}
          </h2>

          <div className="mt-8 w-8 h-px bg-accent/50" />

          <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-sm font-light">
            {content.body}
          </p>

          <div className="mt-8">
            <Roast level={content.roastLevel} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {content.flavorNotes.map((n) => (
              <Badge key={n} variant="outline" className="font-normal text-[11px] rounded-sm">
                {n}
              </Badge>
            ))}
          </div>

          <div className="mt-10 flex items-baseline gap-6">
            <span className="font-display text-[2rem] font-light tabular-nums">
              {formatCop(content.priceCents)}
            </span>
            <Link
              href={`/p/${content.productSlug}`}
              className="group inline-flex items-center gap-2.5 text-sm font-medium tracking-wide border-b border-foreground/25 pb-1 hover:border-foreground transition-colors duration-200"
            >
              Comprar
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </motion.div>

        {/* ── Image — full-bleed right (bleeds to right edge) ── */}
        <motion.div
          className="relative min-h-[320px] lg:min-h-[560px] overflow-hidden"
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          aria-label={content.imageAlt}
        >
          <SpotlightImage alt={content.imageAlt} />
          {/* Edge fade toward text */}
          <div
            className="absolute inset-y-0 left-0 w-20 z-10"
            style={{
              background: "linear-gradient(to right, var(--background), transparent)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
