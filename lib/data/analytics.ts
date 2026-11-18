// Métricas del panel de la tienda (/v1/admin/analytics/*) y de la plataforma
// (/v1/platform/analytics/*). Sin datos de ejemplo: si la API falla, la página
// muestra el error en vez de números inventados.
import { env } from "../env";
import { clientIpHeaders } from "@/lib/api/client-ip";

// ── Rango ────────────────────────────────────────────────────────────────────

export type RangePreset = "7d" | "30d" | "90d" | "12m";
export const RANGE_PRESETS: { key: RangePreset; label: string }[] = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "12m", label: "12 meses" },
];

export interface RangeParams {
  preset: RangePreset | "custom";
  from?: string;
  to?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Lee `?range=` o `?from=&to=` de la URL. Por defecto, 30 días. */
export function parseRange(sp: Record<string, string | string[] | undefined>): RangeParams {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const from = one("from");
  const to = one("to");
  if (from && to && DATE_RE.test(from) && DATE_RE.test(to) && from <= to) {
    return { preset: "custom", from, to };
  }
  const r = one("range");
  const preset = RANGE_PRESETS.some((p) => p.key === r) ? (r as RangePreset) : "30d";
  return { preset };
}

/** Día de hoy en Colombia (la API trabaja con días de Bogotá). */
function todayBogota(): string {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

function minusDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
}

export function rangeQuery(r: RangeParams): string {
  if (r.preset === "custom" && r.from && r.to) return `from=${r.from}&to=${r.to}`;
  const to = todayBogota();
  const days = r.preset === "7d" ? 7 : r.preset === "90d" ? 90 : r.preset === "12m" ? 365 : 30;
  return `from=${minusDays(to, days - 1)}&to=${to}`;
}

// ── Respuestas ───────────────────────────────────────────────────────────────

export interface RangeInfo {
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  days: number;
  previous: { from: string; to: string };
}

export interface SalesTotals {
  revenueCents: number;
  orders: number;
  avgTicketCents: number;
  discountCents: number;
  refundedCents: number;
  refundedOrders: number;
  cancelledOrders: number;
}

export interface SalesAnalytics {
  range: RangeInfo;
  totals: SalesTotals;
  previous: SalesTotals;
  change: { revenue: number | null; orders: number | null; avgTicket: number | null };
  bySource: { source: "CHECKOUT" | "SUBSCRIPTION_RENEWAL" | "GIFT"; cents: number; orders: number }[];
  series: { date: string; checkoutCents: number; subscriptionCents: number; giftCents: number; orders: number }[];
  pendingPayment: {
    count: number;
    cents: number;
    oldest: { id: string; customer: string; totalCents: number; ageDays: number }[];
  };
  promotions: { code: string; orders: number; revenueCents: number; discountCents: number }[];
}

export interface SubscriptionAnalytics {
  range: RangeInfo;
  counts: Record<"ACTIVE" | "PAUSED" | "SKIPPED_NEXT" | "CANCELLED" | "PAYMENT_FAILED", number>;
  live: number;
  mrrCents: number;
  avgRevenuePerSubCents: number;
  frequencies: { days: number; count: number }[];
  newInRange: number;
  cancelledInRange: number;
  churnPct: number | null;
  series: { date: string; new: number; cancelled: number }[];
  approximate: boolean;
}

export interface RoastPlan {
  generatedAt: string;
  totals: { grams7: number; grams14: number; openOrderGrams: number };
  lines: {
    product: string;
    grind: string;
    grams7: number;
    grams14: number;
    shipments7: number;
    shipments14: number;
  }[];
}

export interface ProductAnalytics {
  range: RangeInfo;
  top: { product: string; units: number; revenueCents: number }[];
  grindMix: { key: string; units: number }[];
  sizeMix: { key: string; units: number }[];
  inventory: {
    variantId: string;
    product: string;
    isAccessory: boolean;
    sizeGrams: number;
    grind: string;
    stock: number;
    unitsPerDay: number;
    daysLeft: number | null;
  }[];
  ratings: { product: string; avg: number; count: number }[];
}

export interface CustomerAnalytics {
  range: RangeInfo;
  buyersInRange: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRatePct: number | null;
  avgLifetimeValueCents: number;
  top: { customerId: string; name: string; email: string; orders: number; cents: number }[];
  atRisk:
    | {
        customerId: string;
        name: string;
        email: string;
        orders: number;
        lifetimeCents: number;
        lastOrderAt: string;
        daysSinceLastOrder: number;
        usualIntervalDays: number;
      }[]
    | null;
  newsletter: { active: number; joined: number; left: number };
}

export interface PlatformRevenue {
  range: RangeInfo;
  mrrCents: number;
  arrCents: number;
  mrrByTier: Record<"STARTER" | "PRO" | "BUSINESS", number>;
  mrrByBillingType: Record<string, number>;
  commissionCents: number;
  commissionPrevCents: number;
  commissionChange: number | null;
  oneTimeCents: number;
  recurringInRangeCents: number;
  totalInRangeCents: number;
  missingAmount: { id: string; name: string }[];
  commissionByTenant: { id: string; name: string; pct: number; gmvCents: number; commissionCents: number }[];
  series: { date: string; commissionCents: number }[];
}

export interface PlatformGmv {
  range: RangeInfo;
  totals: { gmvCents: number; orders: number; sellingStores: number; avgTicketCents: number };
  previous: { gmvCents: number; orders: number; sellingStores: number; avgTicketCents: number };
  change: { gmv: number | null; orders: number | null };
  series: { date: string; cents: number; orders: number }[];
  byTenant: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    gmvCents: number;
    previousCents: number;
    change: number | null;
  }[];
}

export interface PlatformGrowth {
  range: RangeInfo;
  total: number;
  liveByTier: Record<"STARTER" | "PRO" | "BUSINESS", number>;
  byBillingStatus: Record<"ACTIVE" | "PAST_DUE" | "CANCELLED" | "INACTIVE", number>;
  newInRange: number;
  cancelledInRange: number;
  churnPct: number | null;
  series: { date: string; new: number; cancelled: number }[];
}

export interface TenantHealth {
  id: string;
  name: string;
  slug: string;
  tier: string;
  score: number;
  level: "ok" | "attention" | "risk";
  reasons: string[];
  orders30: number;
  orders30Prev: number;
  daysSinceLastOrder: number | null;
  daysSinceOperatorActivity: number | null;
  activeProducts: number;
}

export interface PlatformHealth {
  generatedAt: string;
  summary: { ok: number; attention: number; risk: number };
  tenants: TenantHealth[];
}

// ── Fetch ────────────────────────────────────────────────────────────────────

/** Resultado con el código HTTP: 402 = el plan no lo incluye, 403 = el rol no. */
export type Fetched<T> = { ok: true; data: T } | { ok: false; status: number };

async function fetchJson<T>(path: string, headers: Record<string, string>): Promise<Fetched<T>> {
  try {
    const res = await fetch(`${env.apiUrlInternal}${path}`, {
      headers: { ...(await clientIpHeaders()), "Content-Type": "application/json", ...headers },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    console.error(`analytics fetch ${path} failed:`, err);
    return { ok: false, status: 0 };
  }
}

async function adminAnalytics<T>(endpoint: string, query = ""): Promise<Fetched<T>> {
  const { cookies, headers } = await import("next/headers");
  const c = await cookies();
  const token =
    c.get("bestcoffee-impersonation")?.value ?? c.get("bestcoffee-operator-session")?.value ?? null;
  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? env.defaultTenantSlug;
  return fetchJson<T>(`/v1/admin/analytics/${endpoint}${query ? `?${query}` : ""}`, {
    "X-Tenant-Slug": slug,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
}

async function platformAnalytics<T>(endpoint: string, query = ""): Promise<Fetched<T>> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get("bestcoffee-operator-session")?.value ?? null;
  return fetchJson<T>(
    `/v1/platform/analytics/${endpoint}${query ? `?${query}` : ""}`,
    token ? { Authorization: `Bearer ${token}` } : {},
  );
}

export const getSalesAnalytics = (r: RangeParams) =>
  adminAnalytics<SalesAnalytics>("sales", rangeQuery(r));
export const getSubscriptionAnalytics = (r: RangeParams) =>
  adminAnalytics<SubscriptionAnalytics>("subscriptions", rangeQuery(r));
export const getProductAnalytics = (r: RangeParams) =>
  adminAnalytics<ProductAnalytics>("products", rangeQuery(r));
export const getCustomerAnalytics = (r: RangeParams) =>
  adminAnalytics<CustomerAnalytics>("customers", rangeQuery(r));
export const getRoastPlan = () => adminAnalytics<RoastPlan>("roast-plan");

export const getPlatformRevenue = (r: RangeParams) =>
  platformAnalytics<PlatformRevenue>("revenue", rangeQuery(r));
export const getPlatformGmv = (r: RangeParams) =>
  platformAnalytics<PlatformGmv>("gmv", rangeQuery(r));
export const getPlatformGrowth = (r: RangeParams) =>
  platformAnalytics<PlatformGrowth>("growth", rangeQuery(r));
export const getPlatformHealth = () => platformAnalytics<PlatformHealth>("health");
