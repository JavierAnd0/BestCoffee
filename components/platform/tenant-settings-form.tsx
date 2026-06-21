"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTenantAction } from "@/lib/actions/platform";

type Tier = "STARTER" | "PRO" | "BUSINESS";

export interface TierFeatures {
  blog: boolean;
  catalog: boolean;
  checkout: boolean;
  customerAccounts: boolean;
  subscriptions: boolean;
  discountCodes: boolean;
  reviews: boolean;
  gifts: boolean;
  customDomain: boolean;
  maxProducts: number;
}

type BooleanFeatureKey = Exclude<keyof TierFeatures, "maxProducts">;

// Etiquetas legibles de cada capacidad para la UI.
const FEATURE_META: { key: BooleanFeatureKey; label: string; help: string }[] = [
  { key: "blog", label: "Blog", help: "Publicar artículos y guías" },
  { key: "catalog", label: "Catálogo", help: "Mostrar productos y precios" },
  { key: "checkout", label: "Compra en línea", help: "Carrito y pago" },
  { key: "customerAccounts", label: "Cuentas de cliente", help: "Registro y login de compradores" },
  { key: "subscriptions", label: "Suscripciones", help: "Suscripciones de café recurrentes" },
  { key: "discountCodes", label: "Códigos de descuento", help: "Cupones y promociones" },
  { key: "reviews", label: "Reseñas", help: "Opiniones de clientes" },
  { key: "gifts", label: "Regalos", help: "Tarjetas y suscripciones de regalo" },
  { key: "customDomain", label: "Dominio propio", help: "Conectar un dominio personalizado" },
];

const BOOLEAN_KEYS = FEATURE_META.map((f) => f.key);

export function TenantSettingsForm({
  tenantId,
  currentTier,
  currentFeatures,
  tierCatalog,
}: {
  tenantId: string;
  currentTier: Tier;
  /** Overrides guardados en el tenant (JSON). */
  currentFeatures: Record<string, unknown>;
  /** Catálogo base por tier (GET /v1/platform/tiers). */
  tierCatalog: Record<Tier, TierFeatures>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tier, setTier] = useState<Tier>(currentTier);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valor efectivo inicial = base del tier actual + overrides guardados.
  const initialEffective = useMemo(() => {
    const base = tierCatalog[currentTier];
    const eff = { ...base };
    for (const k of BOOLEAN_KEYS) {
      if (typeof currentFeatures[k] === "boolean") {
        eff[k] = currentFeatures[k] as boolean;
      }
    }
    if (typeof currentFeatures.maxProducts === "number") {
      eff.maxProducts = currentFeatures.maxProducts;
    }
    return eff;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [features, setFeatures] = useState<TierFeatures>(initialEffective);

  // Al cambiar de tier, reseteamos los toggles a los valores base de ese tier
  // (el operador puede ajustar overrides después).
  function handleTierChange(next: Tier) {
    setTier(next);
    setFeatures(tierCatalog[next]);
    setSaved(false);
  }

  function toggle(key: (typeof BOOLEAN_KEYS)[number]) {
    setFeatures((f) => ({ ...f, [key]: !f[key] }));
    setSaved(false);
  }

  // Overrides = solo lo que difiere de la base del tier seleccionado, para que
  // el JSON guardado quede mínimo y coherente con resolveFeatures del backend.
  function computeOverrides(): Record<string, unknown> {
    const base = tierCatalog[tier];
    const overrides: Record<string, unknown> = {};
    for (const k of BOOLEAN_KEYS) {
      if (features[k] !== base[k]) overrides[k] = features[k];
    }
    if (features.maxProducts !== base.maxProducts) {
      overrides.maxProducts = features.maxProducts;
    }
    return overrides;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateTenantAction(tenantId, {
        tier,
        features: computeOverrides(),
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const base = tierCatalog[tier];

  return (
    <div className="space-y-5">
      {/* Selector de tier */}
      <div>
        <label className="text-sm font-medium">Plan (tier)</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["STARTER", "PRO", "BUSINESS"] as Tier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTierChange(t)}
              aria-pressed={tier === t}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                (tier === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles de features */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Capacidades</p>
        <p className="text-xs text-muted-foreground mb-2">
          Los toggles parten del plan elegido. Cámbialos solo si quieres una
          excepción para esta tienda.
        </p>
        <div className="rounded-md border border-border divide-y divide-border">
          {FEATURE_META.map(({ key, label, help }) => {
            const on = features[key] as boolean;
            const isOverride = on !== base[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {label}
                    {isOverride && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded px-1 py-0.5">
                        excepción
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{help}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={label}
                  onClick={() => toggle(key)}
                  className={
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
                    (on ? "bg-foreground" : "bg-muted-foreground/30")
                  }
                >
                  <span
                    className={
                      "inline-block size-4 transform rounded-full bg-background transition-transform " +
                      (on ? "translate-x-6" : "translate-x-1")
                    }
                  />
                </button>
              </div>
            );
          })}

          {/* maxProducts */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Máximo de productos</p>
              <p className="text-xs text-muted-foreground">−1 = ilimitado</p>
            </div>
            <input
              type="number"
              value={features.maxProducts}
              onChange={(e) => {
                setFeatures((f) => ({ ...f, maxProducts: parseInt(e.target.value, 10) || 0 }));
                setSaved(false);
              }}
              className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right outline-none focus-visible:border-foreground/40"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && !isPending && (
          <span className="text-sm text-green-700 flex items-center gap-1">
            <Check className="size-4" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
