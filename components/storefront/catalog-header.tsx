"use client";

import { motion } from "motion/react";

const TABS = ["Todos", "Mezclas", "Origen único", "Descafeinado", "Cold brew"];

export function CatalogHeader() {
  return (
    <motion.div
      className="mb-14 lg:mb-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Magazine-style header row */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="eyebrow block mb-3">Catálogo</span>
          <h2 className="font-display font-light text-[clamp(2.4rem,5vw,3.75rem)] leading-none tracking-tight">
            Los más vendidos
          </h2>
        </div>
        {/* Issue/edition number — editorial detail */}
        <span
          className="font-display font-light text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight hidden sm:block"
          style={{ color: "transparent", WebkitTextStroke: "1px rgba(23,13,4,0.12)" }}
          aria-hidden="true"
        >
          №12
        </span>
      </div>

      {/* Full-width rule */}
      <div className="w-full h-px mb-8" style={{ background: "var(--line-strong)" }} />

      {/* Filter tabs — editorial pill style */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={
              "border text-xs font-medium tracking-wide px-4 py-1.5 transition-all duration-200 rounded-none " +
              (i === 0
                ? "bg-foreground text-background border-foreground"
                : "border-line-strong text-muted-foreground hover:text-foreground hover:border-foreground/35")
            }
            style={{ borderRadius: "2px" }}
          >
            {t}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
