"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatCop } from "@/lib/format";
import type { FeaturedPackContent } from "@/lib/types";

function ImageBlock({ title }: { title: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(148deg,#0f0603 0%,#2a1208 30%,#562814 58%,#8a4422 80%,#b8703a 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 38% 45%, rgba(200,140,60,0.2) 0%, transparent 58%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.048]"
        style={{ backgroundImage: "var(--grain)", backgroundSize: "200px" }}
      />
      {/* Pull-quote text over image */}
      <div className="absolute bottom-8 left-8 right-8">
        <p className="font-display text-white/30 text-[clamp(1.1rem,2.5vw,1.5rem)] font-light italic leading-snug select-none">
          "{title}"
        </p>
      </div>
    </div>
  );
}

export function FeaturedPack({ content }: { content: FeaturedPackContent }) {
  return (
    <section className="overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">

        {/* ── Image — full-bleed left (no container padding) ── */}
        <motion.div
          className="relative min-h-[320px] lg:min-h-[540px] overflow-hidden"
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          aria-label={`Imagen de ${content.title}`}
        >
          <ImageBlock title={content.title} />
        </motion.div>

        {/* ── Text side ── */}
        <motion.div
          className="flex flex-col justify-center px-8 lg:px-14 xl:px-16 py-16 lg:py-24"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <span className="eyebrow mb-5">{content.eyebrow}</span>

          <h2 className="font-display font-light text-[clamp(2.2rem,4vw,3.25rem)] leading-tight tracking-tight">
            {content.title}
          </h2>

          <div className="mt-8 w-8 h-px bg-accent/50" />

          <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-sm font-light">
            {content.description}
          </p>

          <div className="mt-10 flex items-baseline gap-4">
            <span className="font-display text-[2rem] font-light tabular-nums">
              {formatCop(content.priceCents)}
            </span>
            <span className="text-xs text-muted-foreground tracking-wide">
              {content.bagsCount} bolsas · ahorra {content.savingsPct}%
            </span>
          </div>

          <Link
            href={`/p/${content.productSlug}`}
            className="mt-8 group inline-flex items-center gap-3 text-sm font-medium tracking-wide w-fit border-b border-foreground/25 pb-1 hover:border-foreground transition-colors duration-200"
          >
            Agregar al carrito
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
