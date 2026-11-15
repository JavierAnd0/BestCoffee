"use client";

import { useState } from "react";
import { Coffee, CupSoda, Gauge, Flame, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/lib/types";

interface Props {
  initialAccessories: Product[];
}

const CATEGORIES = [
  { id: "all", label: "Todos los accesorios", icon: Sparkles },
  { id: "molinos", label: "Molinos", icon: Gauge },
  { id: "teteras", label: "Teteras", icon: Flame },
  { id: "tazas", label: "Tazas", icon: CupSoda },
  { id: "metodos", label: "Métodos & Goteros", icon: Coffee },
];

export function AccessoriesCatalog({ initialAccessories }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? initialAccessories
      : initialAccessories.filter(
          (p) =>
            p.collectionSlugs.includes(activeCategory) ||
            p.name.toLowerCase().includes(activeCategory.slice(0, -1))
        );

  return (
    <div className="space-y-8">
      {/* Selector de categorías de accesorios */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer " +
                (isActive
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              <Icon className="size-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Mostrando {filtered.length} {filtered.length === 1 ? "accesorio" : "accesorios"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No hay accesorios en esta categoría en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {filtered.map((item) => (
            <ProductCard key={item.id} product={item} imageHeight={220} />
          ))}
        </div>
      )}
    </div>
  );
}

