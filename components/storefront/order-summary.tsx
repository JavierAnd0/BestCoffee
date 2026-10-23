"use client";

import { useState } from "react";
import { Truck, Tag, X, Check } from "lucide-react";
import { useCart } from "./cart-context";
import { Button } from "@/components/ui/button";
import { formatCop } from "@/lib/format";
import { TENANT_ORIGEN } from "@/lib/mocks/tenant";

interface OrderSummaryProps {
  compact?: boolean;
  appliedDiscount?: { code: string; percent: number; discountCents: number } | null;
  onApplyDiscountCode?: (code: string) => { success: boolean; message: string };
  onRemoveDiscountCode?: () => void;
}

export function OrderSummary({
  compact = false,
  appliedDiscount,
  onApplyDiscountCode,
  onRemoveDiscountCode,
}: OrderSummaryProps) {
  const { items, subtotalCents } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const threshold = TENANT_ORIGEN.freeShippingThresholdCents;
  const hasFreeShipping =
    subtotalCents >= threshold || appliedDiscount?.code === "ENVIOGRATIS";
  const shippingCents = hasFreeShipping ? 0 : 12_000_00;

  // Subscription discount on already-discounted items shows as a saved-line
  const subscriptionSavings = items
    .filter((i) => i.mode === "SUBSCRIPTION")
    .reduce((n, i) => n + Math.round(i.unitPriceCents * 0.15 * i.qty), 0);

  // Descuento por cupón
  const discountAmountCents = appliedDiscount ? appliedDiscount.discountCents : 0;

  const totalCents = Math.max(0, subtotalCents + shippingCents - discountAmountCents);
  const hasSubscription = items.some((i) => i.mode === "SUBSCRIPTION");

  function handleApply() {
    setCouponFeedback(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (onApplyDiscountCode) {
      const res = onApplyDiscountCode(code);
      if (res.success) {
        setCouponFeedback({ type: "success", message: res.message });
        setCouponInput("");
      } else {
        setCouponFeedback({ type: "error", message: res.message });
      }
    }
  }

  return (
    <div
      className={
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs " +
        (compact ? "p-5" : "p-6")
      }
    >
      <h2 className="font-display text-xl font-semibold mb-4 tracking-tight">
        Resumen del pedido
      </h2>

      {/* Lista de productos */}
      <div className="space-y-3.5 mb-5 max-h-[360px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Tu carrito está vacío.
          </p>
        ) : (
          items.map((i) => (
            <div key={`${i.variantId}-${i.mode}`} className="flex gap-3 items-center">
              <div className="relative size-14 rounded-lg bg-muted flex-shrink-0 grid place-items-center border border-border/40">
                <span className="text-xs text-muted-foreground font-medium">☕</span>
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-foreground text-background text-[10px] font-semibold grid place-items-center shadow-xs">
                  {i.qty}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight truncate">
                  {i.productName}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {i.variantLabel}
                </div>
                {i.mode === "SUBSCRIPTION" && (
                  <div className="text-[11px] text-primary font-medium mt-1 inline-flex items-center gap-1">
                    <Truck className="size-3" />
                    Suscripción {i.frequencyDays ? `c/${i.frequencyDays / 7} sem` : ""}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatCop(i.unitPriceCents * i.qty)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Cupón de descuento interactivo */}
      {!compact && items.length > 0 && (
        <div className="pb-5 border-b border-border space-y-2">
          {appliedDiscount ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Tag className="size-3.5" />
                <span>
                  Cupón: <strong>{appliedDiscount.code}</strong> (-{appliedDiscount.percent}%)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRemoveDiscountCode?.();
                  setCouponFeedback(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Quitar cupón"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                placeholder="Código de descuento (ej. BIENVENIDO)"
                className="flex-1 uppercase rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus-visible:border-ring placeholder:normal-case placeholder:text-muted-foreground"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApply}
                disabled={!couponInput.trim()}
                className="text-xs h-8 px-3"
              >
                Aplicar
              </Button>
            </div>
          )}

          {couponFeedback && (
            <p
              className={
                "text-xs flex items-center gap-1 " +
                (couponFeedback.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive")
              }
            >
              {couponFeedback.type === "success" && <Check className="size-3" />}
              {couponFeedback.message}
            </p>
          )}
        </div>
      )}

      {/* Desglose de totales */}
      <div className="py-4 space-y-2.5 border-b border-border">
        <Row label="Subtotal" value={formatCop(subtotalCents)} />
        <Row
          label="Envío"
          value={
            hasFreeShipping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Gratis
              </span>
            ) : (
              formatCop(shippingCents)
            )
          }
        />
        {appliedDiscount && discountAmountCents > 0 && (
          <Row
            label={`Descuento cupón (${appliedDiscount.code})`}
            value={
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                –{formatCop(discountAmountCents)}
              </span>
            }
          />
        )}
        {subscriptionSavings > 0 && (
          <Row
            label="Ahorro por suscripción (15%)"
            value={
              <span className="text-primary font-medium">
                –{formatCop(subscriptionSavings)}
              </span>
            }
          />
        )}
      </div>

      {/* Total final */}
      <div className="pt-4 flex items-baseline justify-between">
        <span className="font-semibold text-base">Total</span>
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">
          {formatCop(totalCents)}
        </span>
      </div>

      {hasSubscription && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
          <Truck className="size-4 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            Incluye una suscripción: primer despacho en 24–48 horas tras tostar, luego según la frecuencia que elegiste. Modifica o cancela cuando quieras sin penalidad.
          </span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="tabular-nums font-medium text-xs">{value}</span>
    </div>
  );
}
