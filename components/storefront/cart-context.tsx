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
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (variantId: string, mode: CartItem["mode"]) => void;
  updateQty: (variantId: string, mode: CartItem["mode"], qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bestcoffee:cart:v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount; defer writes until after that
  // so the initial empty state can't clobber a saved cart on first render.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((incoming) => {
    setItems((curr) => {
      const i = curr.findIndex(
        (x) => x.variantId === incoming.variantId && x.mode === incoming.mode,
      );
      const qty = incoming.qty ?? 1;
      if (i >= 0) {
        const next = curr.slice();
        next[i] = { ...next[i], qty: next[i].qty + qty };
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
              ? { ...x, qty: Math.max(0, qty) }
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
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      addItem,
      removeItem,
      updateQty,
      clear,
    }),
    [items, isOpen, addItem, removeItem, updateQty, clear],
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
  const GRIND_LABEL: Record<ProductVariant["grind"], string> = {
    WHOLE_BEAN: "Grano",
    ESPRESSO: "Espresso",
    FILTER: "Filtro",
    FRENCH_PRESS: "Prensa",
  };
  const size = variant.sizeGrams >= 1000 ? `${variant.sizeGrams / 1000} kg` : `${variant.sizeGrams} g`;
  const unit =
    mode === "SUBSCRIPTION" && variant.priceSubscriptionCents != null
      ? variant.priceSubscriptionCents
      : variant.priceOneTimeCents;
  return {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    variantId: variant.id,
    variantLabel: `${size} · ${GRIND_LABEL[variant.grind]}`,
    unitPriceCents: unit,
    mode,
    frequencyDays,
  };
}
