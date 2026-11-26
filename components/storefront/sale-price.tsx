import { formatCop } from "@/lib/format";
import type { ProductVariant } from "@/lib/types";

/**
 * Rebaja de una variante: % de descuento frente a su precio "antes", o null si
 * no tiene uno válido. Aplica solo a la compra única (la suscripción tiene su
 * propio precio y descuento).
 */
export function salePct(v: Pick<ProductVariant, "priceOneTimeCents" | "compareAtCents"> | undefined): number | null {
  if (!v?.compareAtCents || v.compareAtCents <= v.priceOneTimeCents) return null;
  const pct = Math.round((1 - v.priceOneTimeCents / v.compareAtCents) * 100);
  return pct > 0 ? pct : null;
}

/** Precio anterior tachado y el % de rebaja, para poner junto al precio actual. */
export function WasPrice({
  variant,
  className = "",
  showPct = true,
}: {
  variant: Pick<ProductVariant, "priceOneTimeCents" | "compareAtCents"> | undefined;
  className?: string;
  showPct?: boolean;
}) {
  const pct = salePct(variant);
  if (pct == null || !variant?.compareAtCents) return null;
  return (
    <span className={"inline-flex items-baseline gap-1.5 " + className}>
      <s className="text-muted-foreground/80 decoration-[1px] tabular-nums">
        <span className="sr-only">Antes </span>
        {formatCop(variant.compareAtCents)}
      </s>
      {showPct && (
        <span className="font-medium text-accent tabular-nums">−{pct}%</span>
      )}
    </span>
  );
}
