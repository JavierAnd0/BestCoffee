"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { GRIND_SHORT } from "@/lib/grind";
import { toast } from "@/components/ui/toast";

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantLabel: string; // "340 g · Grano"
  unitPriceCents: number;
  qty: number;
  mode: "ONCE" | "SUBSCRIPTION";
  frequencyDays?: number;
  /** Portada del producto (los carritos guardados antes no la tienen). */
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  /** Umbral de envío gratis de la tienda actual (centavos). */
  freeShippingThresholdCents: number;
  shippingFlatCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (variantId: string, mode: CartItem["mode"]) => void;
  updateQty: (variantId: string, mode: CartItem["mode"], qty: number) => void;
  clear: () => void;
  /** Tienda actual (para guardar por tienda otros datos del navegador). */
  tenantSlug: string | null;
}

const Ctx = createContext<CartContextValue | null>(null);

const STORAGE_PREFIX = "bestcoffee:cart:v1";

function resolveTenant(tenantSlug?: string): string | null {
  if (tenantSlug) return tenantSlug;
  if (typeof document !== "undefined") {
    const domTenant = document
      .querySelector("[data-tenant]")
      ?.getAttribute("data-tenant");
    if (domTenant) return domTenant;
  }
  return null;
}

function resolveStorageKey(tenantSlug?: string): string {
  const tenant = resolveTenant(tenantSlug);
  return tenant ? `${STORAGE_PREFIX}:${tenant}` : STORAGE_PREFIX;
}

export function CartProvider({
  tenantSlug,
  freeShippingThresholdCents,
  shippingFlatCents,
  children,
}: {
  tenantSlug?: string;
  freeShippingThresholdCents?: number;
  shippingFlatCents?: number;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount; defer writes until after that
  // so the initial empty state can't clobber a saved cart on first render.
  useEffect(() => {
    const key = resolveStorageKey(tenantSlug);
    let initialItems: CartItem[] = [];
    try {
      const raw = localStorage.getItem(key) ?? localStorage.getItem(STORAGE_PREFIX);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) initialItems = parsed;
      }
    } catch {}
    queueMicrotask(() => {
      if (initialItems.length > 0) setItems(initialItems);
      setHydrated(true);
    });
  }, [tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    const key = resolveStorageKey(tenantSlug);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {}
  }, [items, hydrated, tenantSlug]);

  const addItem = useCallback<CartContextValue["addItem"]>((incoming) => {
    setItems((curr) => {
      const i = curr.findIndex(
        (x) => x.variantId === incoming.variantId && x.mode === incoming.mode,
      );
      // Una suscripción envía una unidad por ciclo: volver a agregarla solo
      // actualiza la frecuencia elegida.
      const isSub = incoming.mode === "SUBSCRIPTION";
      const qty = isSub ? 1 : (incoming.qty ?? 1);
      if (i >= 0) {
        const next = curr.slice();
        next[i] = isSub
          ? { ...next[i], frequencyDays: incoming.frequencyDays, qty: 1 }
          : { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...curr, { ...incoming, qty }];
    });
    toast({
      title: `${incoming.productName} agregado`,
      description: incoming.variantLabel,
      action: { label: "Ver carrito →", onClick: () => setOpen(true) },
    });
  }, []);

  const removeItem = useCallback<CartContextValue["removeItem"]>((variantId, mode) => {
    setItems((c) => c.filter((x) => !(x.variantId === variantId && x.mode === mode)));
  }, []);

  const updateQty = useCallback<CartContextValue["updateQty"]>(
    (variantId, mode, qty) => {
      setItems((c) =>
        c
          .map((x) =>
            x.variantId === variantId && x.mode === mode
              ? {
                  ...x,
                  qty:
                    mode === "SUBSCRIPTION"
                      ? Math.min(1, Math.max(0, qty))
                      : Math.max(0, qty),
                }
              : x,
          )
          .filter((x) => x.qty > 0),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotalCents: items.reduce((n, i) => n + i.qty * i.unitPriceCents, 0),
      freeShippingThresholdCents: freeShippingThresholdCents ?? 150_000_00,
      shippingFlatCents: shippingFlatCents ?? 12_000_00,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      addItem,
      removeItem,
      updateQty,
      clear,
      tenantSlug: resolveTenant(tenantSlug),
    }),
    [items, isOpen, addItem, removeItem, updateQty, clear, freeShippingThresholdCents, shippingFlatCents, tenantSlug],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart outside CartProvider");
  return v;
}

// Helper used by PDP/quick-add to map a product+variant into a CartItem.
export function buildCartItem(
  product: Product,
  variant: ProductVariant,
  mode: CartItem["mode"],
  frequencyDays?: number,
): Omit<CartItem, "qty"> {
  const variantLabel =
    product.type === "ACCESSORY"
      ? "Accesorio · Barismo"
      : `${variant.sizeGrams >= 1000 ? `${variant.sizeGrams / 1000} kg` : `${variant.sizeGrams} g`} · ${GRIND_SHORT[variant.grind] || "Grano"}`;
  const unit =
    mode === "SUBSCRIPTION" && variant.priceSubscriptionCents != null
      ? variant.priceSubscriptionCents
      : variant.priceOneTimeCents;
  return {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    variantId: variant.id,
    variantLabel,
    unitPriceCents: unit,
    mode,
    frequencyDays,
    imageUrl: product.images[0]?.url,
  };
}
