"use client";

import { useMemo, useState } from "react";
import { Check, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { formatCop } from "@/lib/format";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart, buildCartItem } from "./cart-context";

const GRIND_LABEL: Record<ProductVariant["grind"], string> = {
  WHOLE_BEAN: "Grano entero",
  ESPRESSO: "Espresso",
  FILTER: "Filtro",
  FRENCH_PRESS: "Prensa",
};

const FREQUENCIES = [
  { days: 7, label: "Cada semana" },
  { days: 14, label: "Cada 2 semanas" },
  { days: 21, label: "Cada 3 semanas" },
  { days: 28, label: "Cada 4 semanas" },
  { days: 42, label: "Cada 6 semanas" },
  { days: 56, label: "Cada 8 semanas" },
];

export function BuyBlock({
  product,
  subscriptionDiscountPct,
}: {
  product: Product;
  subscriptionDiscountPct: number;
}) {
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.sizeGrams))).sort((a, b) => a - b),
    [product.variants],
  );
  const grinds = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.grind))),
    [product.variants],
  );

  const [size, setSize] = useState(sizes[0]);
  const [grind, setGrind] = useState<ProductVariant["grind"]>(grinds[0]);
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<"once" | "sub">("sub");
  const [freqDays, setFreqDays] = useState(14);
  const cart = useCart();

  const variant =
    product.variants.find((v) => v.sizeGrams === size && v.grind === grind) ??
    product.variants.find((v) => v.sizeGrams === size) ??
    product.variants[0];

  const isSubOnly = product.subscriptionAvailability === "SUBSCRIPTION_ONLY";
  const isSub = mode === "sub" || isSubOnly;
  const unit =
    isSub && variant.priceSubscriptionCents != null
      ? variant.priceSubscriptionCents
      : variant.priceOneTimeCents;
  const total = unit * qty;

  // Format first-ship date roughly: today + 5 business days estimate.
  const firstShip = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  }, []);

  return (
    <div className="space-y-7">
      <VariantSection label="Tamaño">
        <PillRow>
          {sizes.map((s) => (
            <Pill key={s} active={s === size} onClick={() => setSize(s)}>
              {s >= 1000 ? `${s / 1000} kg` : `${s} g`}
            </Pill>
          ))}
        </PillRow>
      </VariantSection>

      <VariantSection label="Molienda">
        <PillRow>
          {grinds.map((g) => (
            <Pill key={g} active={g === grind} onClick={() => setGrind(g)}>
              {GRIND_LABEL[g]}
            </Pill>
          ))}
        </PillRow>
      </VariantSection>

      <VariantSection label="Modalidad de compra">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {!isSubOnly && (
            <ModeCard
              active={mode === "once"}
              onClick={() => setMode("once")}
              title="Compra única"
              subtitle={formatCop(variant.priceOneTimeCents)}
            />
          )}
          {variant.priceSubscriptionCents != null && (
            <ModeCard
              active={mode === "sub" || isSubOnly}
              onClick={() => setMode("sub")}
              title={`Suscripción · ahorra ${subscriptionDiscountPct}%`}
              subtitle={`${formatCop(variant.priceSubscriptionCents)} · cancela cuando quieras`}
            />
          )}
        </div>
        {isSub && (
          <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Frecuencia de entrega
            </div>
            <PillRow>
              {FREQUENCIES.map((f) => (
                <Pill
                  key={f.days}
                  active={f.days === freqDays}
                  onClick={() => setFreqDays(f.days)}
                >
                  {f.days >= 7 ? `${f.days / 7} sem` : `${f.days} d`}
                </Pill>
              ))}
            </PillRow>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Truck className="size-3.5 mt-0.5" />
              <span>
                Primer envío ~{firstShip} · luego{" "}
                {FREQUENCIES.find((f) => f.days === freqDays)?.label.toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </VariantSection>

      <div className="flex items-center gap-3">
        <Stepper value={qty} onChange={setQty} />
        <Button
          size="lg"
          className="flex-1 justify-center h-12 text-base"
          onClick={() =>
            cart.addItem({
              ...buildCartItem(
                product,
                variant,
                isSub ? "SUBSCRIPTION" : "ONCE",
                isSub ? freqDays : undefined,
              ),
              qty,
            })
          }
        >
          Agregar al carrito · {formatCop(total)}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Envío gratis en pedidos +$45.000 · Tostado bajo pedido
      </p>
    </div>
  );
}

function VariantSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-4 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground/80 hover:border-foreground/40 hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick?: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex items-start gap-3 text-left rounded-md border p-4 transition-colors " +
        (active
          ? "border-foreground/50 bg-background"
          : "border-border bg-background/60 hover:border-foreground/30")
      }
    >
      <span
        className={
          "mt-0.5 grid place-items-center size-4 rounded-full border " +
          (active
            ? "border-foreground bg-foreground text-background"
            : "border-foreground/30")
        }
      >
        {active && <Check className="size-2.5" strokeWidth={3} />}
      </span>
      <span>
        <span className="block font-medium text-sm">{title}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{subtitle}</span>
      </span>
    </button>
  );
}
