"use client";

import { useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "./cart-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { ShipBar } from "@/components/ui/ship-bar";
import { formatCop } from "@/lib/format";
import { Tooltip } from "@/components/ui/tooltip";
import { ItemThumb } from "./item-thumb";

export function CartDrawer() {
  const {
    items,
    isOpen,
    close,
    removeItem,
    updateQty,
    subtotalCents,
    freeShippingThresholdCents: threshold,
  } = useCart();
  const pct = Math.min(100, (subtotalCents / threshold) * 100);
  const remainingCents = Math.max(0, threshold - subtotalCents);
  // Al abrir, el foco va a la lista (no al primer «Quitar»): así no aparece
  // un anillo de foco sobre la X de un producto sin que nadie la haya tocado.
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
        initialFocus={items.length > 0 ? listRef : true}
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="font-display text-xl font-semibold">
            Tu carrito {items.length > 0 && `(${items.length})`}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Productos en tu carrito de compras
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6 py-12 text-center">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
              <Button
                variant="outline"
                onClick={close}
                render={<Link href="/catalogo">Explorar catálogo</Link>}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-4 pb-3 border-b border-border">
              {pct < 100 ? (
                <ShipBar
                  pct={pct}
                  remaining={formatCop(remainingCents)}
                />
              ) : (
                <div className="text-xs text-foreground font-medium">
                  ✓ Tu pedido tiene envío gratis
                </div>
              )}
            </div>

            <div
              ref={listRef}
              tabIndex={-1}
              aria-label="Productos del carrito"
              className="flex-1 overflow-y-auto px-6 py-4 space-y-5 outline-none"
            >
              {items.map((item) => (
                <article
                  key={`${item.variantId}-${item.mode}`}
                  className="flex gap-4"
                >
                  <Link
                    href={`/p/${item.productSlug}`}
                    onClick={close}
                    tabIndex={-1}
                    aria-hidden
                  >
                    <ItemThumb src={item.imageUrl} alt="" className="size-20" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold truncate">
                        {item.productName}
                      </h3>
                      <Tooltip content="Quitar">
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId, item.mode)}
                          className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          aria-label={`Quitar ${item.productName}`}
                        >
                          <X className="size-4" strokeWidth={1.75} />
                        </button>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.variantLabel}
                      {item.mode === "SUBSCRIPTION" &&
                        ` · Suscripción ${
                          item.frequencyDays ? `c/${item.frequencyDays / 7} sem` : ""
                        }`}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      {item.mode === "SUBSCRIPTION" ? (
                        <span className="text-xs text-muted-foreground">
                          1 unidad por envío
                        </span>
                      ) : (
                        <Stepper
                          value={item.qty}
                          onChange={(n) => updateQty(item.variantId, item.mode, n)}
                        />
                      )}
                      <span className="font-semibold tabular-nums text-sm">
                        {formatCop(item.unitPriceCents * item.qty)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-border px-6 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-semibold tabular-nums">
                  {formatCop(subtotalCents)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Envío e impuestos calculados al pagar.
              </p>
              <Button
                size="lg"
                className="w-full h-12 text-base justify-center"
                onClick={close}
                render={<Link href="/checkout">Ir a pagar →</Link>}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
