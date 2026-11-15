"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { setDemoFeaturesAction } from "@/lib/actions/demo";
import type { DemoKey } from "@/lib/demo";
import type { TenantFeatures } from "@/lib/types";

const TOGGLES: { key: DemoKey; label: string; help: string }[] = [
  { key: "catalog", label: "Catálogo", help: "Productos y precios" },
  { key: "accessories", label: "Accesorios", help: "Molinos, teteras…" },
  { key: "blog", label: "Blog", help: "Artículos y guías" },
  { key: "checkout", label: "Pedidos", help: "Carrito y recepción de pedidos" },
  { key: "customerAccounts", label: "Cuentas de cliente", help: "Registro e historial" },
  { key: "subscriptions", label: "Suscripciones", help: "Café recurrente" },
  { key: "discountCodes", label: "Cupones", help: "Códigos de descuento" },
  { key: "reviews", label: "Reseñas", help: "Opiniones de clientes" },
];

const OFF: Record<DemoKey, boolean> = {
  catalog: false,
  accessories: false,
  blog: false,
  checkout: false,
  customerAccounts: false,
  subscriptions: false,
  discountCodes: false,
  reviews: false,
};

const PRESETS: { label: string; help: string; state: Record<DemoKey, boolean> }[] = [
  { label: "Solo landing", help: "Presencia en línea", state: OFF },
  {
    label: "Catálogo",
    help: "Muestra productos y precios",
    state: { ...OFF, catalog: true, accessories: true, blog: true },
  },
  {
    label: "Pedidos",
    help: "Recibe pedidos de clientes",
    state: { ...OFF, catalog: true, accessories: true, blog: true, checkout: true, customerAccounts: true },
  },
  {
    label: "Tienda completa",
    help: "Todo encendido",
    state: {
      catalog: true,
      accessories: true,
      blog: true,
      checkout: true,
      customerAccounts: true,
      subscriptions: true,
      discountCodes: true,
      reviews: true,
    },
  },
];

/**
 * Panel de la tienda demo: la cafetería enciende y apaga funciones y ve cómo
 * cambia el sitio al instante. El estado es solo suyo (cookie de 1 día) y la
 * demo nunca cobra: no hay pagos en línea.
 */
export function DemoPanel({ features }: { features: TenantFeatures }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const current = Object.fromEntries(TOGGLES.map((t) => [t.key, features[t.key]])) as Record<
    DemoKey,
    boolean
  >;

  function apply(state: Record<DemoKey, boolean> | null) {
    startTransition(async () => {
      await setDemoFeaturesAction(state);
      router.refresh();
    });
  }

  return (
    <div className="fixed z-50 left-4 bottom-24 lg:bottom-6">
      {open ? (
        <section
          aria-label="Funciones de la demo"
          className="w-[19rem] max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl"
        >
          <header className="flex items-start justify-between gap-3 p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Arma tu tienda</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enciende o apaga funciones y mira el sitio cambiar. Es solo una demo: no cobra.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar panel"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="p-4 space-y-4" aria-busy={isPending}>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={isPending}
                  onClick={() => apply(p.state)}
                  className="rounded-md border border-border px-2.5 py-2 text-left hover:border-foreground/40 disabled:opacity-60"
                >
                  <span className="block text-xs font-medium">{p.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{p.help}</span>
                </button>
              ))}
            </div>

            <ul className="divide-y divide-border rounded-md border border-border">
              {TOGGLES.map(({ key, label, help }) => {
                const on = current[key];
                return (
                  <li key={key} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{help}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={label}
                      disabled={isPending}
                      onClick={() => apply({ ...current, [key]: !on })}
                      className={
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 " +
                        (on ? "bg-foreground" : "bg-muted-foreground/30")
                      }
                    >
                      <span
                        className={
                          "inline-block size-3.5 transform rounded-full bg-background transition-transform " +
                          (on ? "translate-x-[1.1rem]" : "translate-x-0.5")
                        }
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              disabled={isPending}
              onClick={() => apply(null)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Restablecer demo
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-xs font-medium shadow-lg"
        >
          <SlidersHorizontal className="size-4" />
          Arma tu tienda
        </button>
      )}
    </div>
  );
}
