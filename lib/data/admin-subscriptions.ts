import { env } from "../env";
import { operatorFetch } from "../api/gateway";

/**
 * Lecturas del panel de suscripciones contra `/v1/admin/subscriptions`
 * (AdminSubscriptionsController). Estados tal como los da la API, más el
 * derivado "esperando el pago del primer pedido".
 */
export type AdminSubApiStatus =
  | "ACTIVE"
  | "PAUSED"
  | "SKIPPED_NEXT"
  | "CANCELLED"
  | "PAYMENT_FAILED";

/** Estado que muestra el panel. */
export type AdminSubDisplayStatus = AdminSubApiStatus | "AWAITING_FIRST_PAYMENT";

export interface AdminSubscriptionItem {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  variantLabel: string;
  frequencyDays: number;
  discountPct: number;
  status: AdminSubDisplayStatus;
  /** Fecha ISO del próximo envío (null si no aplica: pausada, cancelada o sin activar). */
  nextShipAt: string | null;
  lastShippedAt: string | null;
  createdAt: string | null;
  /** Precio de cada envío: precio de suscripción menos el descuento propio. */
  unitPriceCents: number | null;
}

interface ApiAdminSub {
  id: string;
  status: AdminSubApiStatus;
  frequencyDays: number;
  discountPct?: number;
  nextShipAt?: string | null;
  lastShippedAt?: string | null;
  createdAt?: string | null;
  customer?: { id?: string; email?: string; name?: string | null } | null;
  variant?: {
    sizeGrams?: number;
    grind?: string;
    priceSubscription?: number | null;
    priceOneTime?: number | null;
    product?: { slug?: string; name?: string } | null;
  } | null;
}

const GRIND: Record<string, string> = {
  WHOLE_BEAN: "Grano",
  ESPRESSO: "Espresso",
  FILTER: "Filtro",
  FRENCH_PRESS: "Prensa",
};

export function mapAdminSubscription(s: ApiAdminSub): AdminSubscriptionItem {
  const awaiting = s.status === "PAYMENT_FAILED" && !s.lastShippedAt;
  const status: AdminSubDisplayStatus = awaiting ? "AWAITING_FIRST_PAYMENT" : s.status;
  const size = s.variant?.sizeGrams
    ? s.variant.sizeGrams >= 1000
      ? `${s.variant.sizeGrams / 1000} kg`
      : `${s.variant.sizeGrams} g`
    : "";
  const base = s.variant?.priceSubscription ?? s.variant?.priceOneTime ?? null;
  const pct = s.discountPct ?? 0;
  const showNext = status === "ACTIVE" || status === "SKIPPED_NEXT";
  return {
    id: s.id,
    customerName: s.customer?.name?.trim() || s.customer?.email || "Cliente",
    customerEmail: s.customer?.email ?? "",
    productName: s.variant?.product?.name ?? "Producto",
    variantLabel: [size, GRIND[s.variant?.grind ?? ""] ?? ""].filter(Boolean).join(" · "),
    frequencyDays: s.frequencyDays,
    discountPct: pct,
    status,
    nextShipAt: showNext ? (s.nextShipAt ?? null) : null,
    lastShippedAt: s.lastShippedAt ?? null,
    createdAt: s.createdAt ?? null,
    unitPriceCents:
      base === null ? null : Math.max(0, base - Math.round((base * pct) / 100)),
  };
}

/** Todas las suscripciones de la tienda (recorre la paginación keyset de 100 en 100). */
export async function listAllAdminSubscriptions(): Promise<{
  items: AdminSubscriptionItem[];
  error: string | null;
}> {
  if (env.useMocks) return { items: [], error: null };
  const all: AdminSubscriptionItem[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: "100" });
    if (cursor) qs.set("cursor", cursor);
    const res = await operatorFetch<{ items?: ApiAdminSub[]; nextCursor?: string | null }>(
      `/v1/admin/subscriptions?${qs.toString()}`,
    );
    if (!res.ok) return { items: all, error: res.error };
    all.push(...(res.data.items ?? []).map(mapAdminSubscription));
    cursor = res.data.nextCursor ?? null;
    if (!cursor) break;
  }
  return { items: all, error: null };
}
