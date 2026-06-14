"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/format";
import type { Product } from "@/lib/types";

// Known enum badges get nicer copy; free-form API badges render verbatim.
const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Más vendido",
  NEW: "Nuevo",
  LIMITED: "Edición limitada",
  SUBSCRIBER_ONLY: "Solo suscriptores",
  SEASONAL: "Temporada",
};

const TYPE_LABEL: Record<Product["type"], string> = {
  BLEND: "Mezcla",
  SINGLE_ORIGIN: "Origen único",
  DECAF: "Descafeinado",
};

function roastGradient(level: number): string {
  if (level <= 3)
    return "linear-gradient(158deg,#3b2010 0%,#6b3d22 45%,#a86840 80%,#c4935a 100%)";
  if (level <= 5)
    return "linear-gradient(158deg,#1f0e06 0%,#3d1c0c 40%,#6b2e14 75%,#8b4520 100%)";
  if (level <= 7)
    return "linear-gradient(158deg,#130804 0%,#2a1008 40%,#4d1e0e 75%,#6b2a10 100%)";
  return "linear-gradient(158deg,#080402 0%,#160a04 40%,#2d1208 75%,#3d1a0c 100%)";
}

export function ProductCard({
  product,
  imageHeight = 260,
}: {
  product: Product;
  imageHeight?: number;
}) {
  const cheapest = product.variants.reduce(
    (a, b) => (a.priceOneTimeCents <= b.priceOneTimeCents ? a : b),
    product.variants[0],
  );
  const badge = product.badges[0];

  return (
    <motion.article
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Image ── */}
      <div
        className="relative overflow-hidden mb-4"
        style={{ height: imageHeight, borderRadius: "2px" }}
      >
        {/* Gradient bg */}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{ background: roastGradient(product.roastLevel) }}
        />

        {/* Centre glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 45% 58%, rgba(190,110,50,0.24) 0%, transparent 58%)",
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.05]"
          style={{ backgroundImage: "var(--grain)", backgroundSize: "200px" }}
        />

        {/* Alt text */}
        <div className="absolute inset-0 grid place-items-center text-[9px] text-white/10 tracking-widest uppercase select-none">
          {product.images[0]?.alt ?? product.name}
        </div>

        {/* Badge */}
        {badge && (
          <span className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="bg-black/35 text-white/85 border-white/8 backdrop-blur-sm text-[10px] rounded-sm"
            >
              {BADGE_LABEL[badge] ?? badge}
            </Badge>
          </span>
        )}

        {/* Add button — emerges from bottom on hover */}
        <button
          aria-label={`Agregar ${product.name} al carrito`}
          className="absolute bottom-3 right-3 z-10 h-8 w-8 rounded-sm bg-background/95 grid place-items-center shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out hover:bg-foreground hover:text-background"
        >
          <Plus className="size-3.5" strokeWidth={2} />
        </button>

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.38), transparent)",
          }}
        />
      </div>

      {/* ── Text ── */}
      <Link href={`/p/${product.slug}`} className="block">
        <p className="eyebrow mb-2">{TYPE_LABEL[product.type]}</p>
        <h3 className="font-display font-light text-[1.15rem] leading-snug tracking-tight transition-colors duration-200 group-hover:text-accent">
          {product.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.flavorNotes.slice(0, 3).map((n) => (
            <span key={n} className="text-[10px] text-muted-foreground font-light">
              {n}
              {product.flavorNotes.indexOf(n) < Math.min(product.flavorNotes.length, 3) - 1 && (
                <span className="mx-1 opacity-40">·</span>
              )}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display font-light text-[1.1rem] tabular-nums">
            {formatCop(cheapest.priceOneTimeCents)}
          </span>
          {cheapest.priceSubscriptionCents && (
            <span className="text-[11px] text-muted-foreground font-light">
              {formatCop(cheapest.priceSubscriptionCents)}/suscr.
            </span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
