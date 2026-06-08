"use client";

import { Truck } from "lucide-react";
import { useCart } from "./cart-context";
import { Button } from "@/components/ui/button";
import { formatCop } from "@/lib/format";
import { TENANT_ORIGEN } from "@/lib/mocks/tenant";

export function OrderSummary({ compact = false }: { compact?: boolean }) {
  const { items, subtotalCents } = useCart();
  const threshold = TENANT_ORIGEN.freeShippingThresholdCents;
  const hasFreeShipping = subtotalCents >= threshold;
  const shippingCents = hasFreeShipping ? 0 : 12_000_00;
  // Subscription discount on already-discounted items shows as a saved-line
  // mirroring what Stripe would do server-side once we wire it up.
  const subscriptionSavings = items
    .filter((i) => i.mode === "SUBSCRIPTION")
    .reduce((n, i) => n + Math.round(i.unitPriceCents * 0.15 * i.qty), 0);
  const totalCents = subtotalCents + shippingCents;

  const hasSubscription = items.some((i) => i.mode === "SUBSCRIPTION");

  return (
    <div className={"rounded-lg border border-border bg-background " + (compact ? "p-5" : "p-6")}>
      <h2 className="font-display text-lg font-semibold mb-4">Resumen del pedido</h2>
      <div className="space-y-3 mb-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
        ) : (
          items.map((i) => (
            <div key={`${i.variantId}-${i.mode}`} className="flex gap-3">
              <div className="relative size-14 rounded-md bg-muted flex-shrink-0">
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-foreground text-background text-[10px] font-semibold grid place-items-center">
                  {i.qty}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{i.productName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{i.variantLabel}</div>
                {i.mode === "SUBSCRIPTION" && (
                  <div className="text-[11px] text-foreground/80 mt-1 inline-flex items-center gap-1">
                    <Truck className="size-3" />
                    Suscripción {i.frequencyDays ? `c/${i.frequencyDays / 7} sem` : ""}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCop(i.unitPriceCents * i.qty)}
              </span>
            </div>
          ))
        )}
      </div>

      {!compact && (
        <div className="flex gap-2 pb-5 border-b border-border">
          <input
            type="text"
            placeholder="Código de descuento"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
          />
          <Button variant="outline" size="sm">
            Aplicar
          </Button>
        </div>
      )}

      <div className="py-4 space-y-2 border-b border-border">
        <Row label="Subtotal" value={formatCop(subtotalCents)} />
        <Row
          label="Envío"
          value={
            hasFreeShipping ? (
              <span className="text-foreground font-medium">Gratis</span>
            ) : (
              formatCop(shippingCents)
            )
          }
        />
        {subscriptionSavings > 0 && (
          <Row
            label="Descuento suscripción (15%)"
            value={`–${formatCop(subscriptionSavings)}`}
          />
        )}
      </div>
      <div className="pt-4 flex items-baseline justify-between">
        <span className="font-medium">Total</span>
        <span className="font-display text-2xl font-semibold tabular-nums">
          {formatCop(totalCents)}
        </span>
      </div>

      {hasSubscription && (
        <div className="mt-5 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <Truck className="size-4 flex-shrink-0 mt-0.5" />
          <span>
            Incluye una suscripción · primer envío en ~5 días hábiles · luego según
            la frecuencia elegida · cancela cuando quieras.
          </span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
