import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Roast } from "@/components/ui/roast";
import { formatCop } from "@/lib/format";
import type { Product, Badge as BadgeKind } from "@/lib/types";

const BADGE_LABEL: Record<BadgeKind, string> = {
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

export function ProductCard({
  product,
  imageHeight = 220,
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
    <article className="group">
      <div className="relative bg-muted rounded-md overflow-hidden mb-4" style={{ height: imageHeight }}>
        {/* Placeholder for product image — Vercel Blob URL once admin uploads */}
        <div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-xs text-muted-foreground"
        >
          {product.images[0]?.alt ?? product.name}
        </div>
        {badge && (
          <span className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {BADGE_LABEL[badge]}
            </Badge>
          </span>
        )}
        <button
          aria-label={`Agregar ${product.name} al carrito`}
          className="absolute bottom-3 right-3 size-9 rounded-full bg-background border border-border grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground hover:text-background hover:border-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <Link href={`/p/${product.slug}`} className="block space-y-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
          {TYPE_LABEL[product.type]}
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight">
          {product.name}
        </h3>
        <Roast level={product.roastLevel} showLabel={false} />
        <div className="flex flex-wrap gap-1.5">
          {product.flavorNotes.slice(0, 3).map((n) => (
            <Badge key={n} variant="outline" className="font-normal text-[11px]">
              {n}
            </Badge>
          ))}
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-semibold tabular-nums">{formatCop(cheapest.priceOneTimeCents)}</span>
          {cheapest.priceSubscriptionCents && (
            <span className="text-xs text-muted-foreground">
              o {formatCop(cheapest.priceSubscriptionCents)}/suscr.
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
