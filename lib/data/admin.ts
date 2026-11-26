import { env } from "../env";
import { apiServer } from "../api/client";
import { formatCop } from "../format";
import { mapProduct, type ApiProduct } from "../api/mappers";
import type { Product } from "../types";
import {
  ADMIN_KPIS,
  ADMIN_ALERTS,
  ADMIN_RECENT_ORDERS,
  SALES_LAST_14D,
  ADMIN_CUSTOMERS,
  ADMIN_DISCOUNTS,
  ADMIN_REVIEWS,
  ADMIN_AUDIT,
  type AdminKpi,
  type AdminAlert,
  type AdminRecentOrder,
  type AdminCustomer,
  type AdminDiscountCode,
  type AdminReview,
  type AdminAuditEntry,
} from "../mocks/admin";
import { clientIpHeaders } from "@/lib/api/client-ip";
import { mapAdminShipment, type AdminShipment } from "@/lib/shipping";

// ── Minimal shapes the backend returns (best-effort; cast at call sites) ─────

interface ApiOrder {
  id: string;
  customer?: { name?: string; email?: string } | null;
  totalCents?: number;
  total?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface ApiReview {
  id: string;
  customer?: { name?: string | null; email?: string } | null;
  customerName?: string;
  product?: { name?: string } | null;
  productName?: string;
  rating?: number;
  body?: string;
  comment?: string;
  status?: string;
  createdAt?: string;
  verifiedSubscriber?: boolean;
}

/** `DiscountCode` tal como lo devuelve `GET /v1/admin/discount-codes` (un arreglo). */
interface ApiDiscountCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  /** PERCENTAGE: 1-100 · FIXED: centavos COP. */
  value: number;
  minSubtotalCents?: number | null;
  maxRedemptions?: number | null;
  timesRedeemed?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
}

interface ApiAuditEntry {
  id: string;
  actor?: { email?: string; name?: string } | null;
  actorEmail?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  createdAt?: string;
  at?: string;
}

interface ApiListResponse<T> {
  items?: T[];
  data?: T[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function items<T>(payload: unknown): T[] {
  // Algunos listados del backend son un arreglo plano (cupones, reseñas); otros
  // vienen paginados como `{ items, nextCursor }`.
  if (Array.isArray(payload)) return payload as T[];
  const p = payload as ApiListResponse<T>;
  return p?.items ?? p?.data ?? [];
}

function ago(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} días`;
}

function mapOrder(o: ApiOrder): AdminRecentOrder {
  return {
    id: o.id,
    customer: o.customer?.name ?? o.customer?.email ?? "—",
    totalCents: o.totalCents ?? o.total ?? 0,
    status: ADMIN_ORDER_STATUS_MAP[o.status ?? ""] ?? "PROCESSING",
    createdAt: ago(o.createdAt),
  } as AdminRecentOrder;
}

function mapReview(r: ApiReview): AdminReview {
  return {
    id: r.id,
    customerName: r.customerName ?? (r.customer?.name || r.customer?.email) ?? "—",
    productName: r.productName ?? r.product?.name ?? "—",
    rating: r.rating ?? 5,
    body: r.body ?? r.comment ?? "",
    status: (r.status as AdminReview["status"]) ?? "PENDING",
    createdAt: ago(r.createdAt),
    verifiedSubscriber: r.verifiedSubscriber ?? false,
  };
}

function formatShortDate(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function mapDiscount(d: ApiDiscountCode): AdminDiscountCode {
  const isPercent = d.type === "PERCENTAGE";
  return {
    id: d.id,
    code: d.code,
    type: isPercent ? "PERCENT" : "FIXED",
    // FIXED llega en centavos (igual que todos los montos de la API).
    value: isPercent ? `${d.value}%` : formatCop(d.value),
    appliesTo: d.minSubtotalCents
      ? `Compras desde ${formatCop(d.minSubtotalCents)}`
      : "Todos los productos",
    usesCount: d.timesRedeemed ?? 0,
    usesLimit: d.maxRedemptions ?? undefined,
    expiresAt: formatShortDate(d.endsAt) ?? "Sin vencimiento",
    active: d.active,
  };
}

function mapAudit(e: ApiAuditEntry): AdminAuditEntry {
  return {
    id: e.id,
    user: e.actor?.name ?? e.actor?.email ?? e.actorEmail ?? "Sistema",
    action: e.action ?? "—",
    entity: e.entity ?? "—",
    entityId: e.entityId ?? "—",
    at: e.at ?? ago(e.createdAt),
  };
}

// ── Admin fetch helper (server-side, operator session) ─────────────────────

async function adminFetch<T>(path: string): Promise<T | null> {
  const { cookies, headers } = await import("next/headers");
  const c = await cookies();
  const token =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value ??
    null;
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug") ?? env.defaultTenantSlug;

  const res = await fetch(`${env.apiUrlInternal}${path}`, {
    headers: {
      ...(await clientIpHeaders()),
      "Content-Type": "application/json",
      "X-Tenant-Slug": tenantSlug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export interface OperatorProfile {
  name: string;
  email: string;
  role: string;
  impersonatingTenant?: string | null;
}

export async function getCurrentOperator(): Promise<OperatorProfile | null> {
  const { cookies } = await import("next/headers");
  const c = await cookies();
  const impersonatingTenant = c.get("bestcoffee-impersonation-tenant")?.value ?? null;

  if (env.useMocks) {
    return {
      name: "María R.",
      email: "hola@cafeorigen.co",
      role: impersonatingTenant ? `Impersonando · ${impersonatingTenant}` : "Tenant Owner",
      impersonatingTenant,
    };
  }

  const token =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value ??
    null;
  if (!token) return null;

  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/me`, {
      headers: { ...(await clientIpHeaders()), Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const me = (await res.json()) as {
        name?: string | null;
        email?: string;
        role?: string;
        isPlatformOwner?: boolean;
      };
      const email = me.email ?? "";
      const name = me.name?.trim() || email.split("@")[0] || "Operador";
      const role = impersonatingTenant
        ? `Impersonando · ${impersonatingTenant}`
        : me.isPlatformOwner
          ? "Superadmin"
          : me.role ?? "Tenant Admin";
      return { name, email, role, impersonatingTenant };
    }
  } catch {
    /* backend sin conexión: sin datos del operador */
  }

  return null;
}

// ── Facturación del tenant (cómo le cobra la plataforma + comisión) ──────────

export interface AdminBilling {
  billingType: "SUBSCRIPTION" | "ONE_TIME" | "COMMISSION";
  billingStatus?: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "INACTIVE";
  commissionPct: number | null;
  pendingCommission: {
    currentPct: number | null;
    proposedPct: number;
    proposedAt: string | null;
  } | null;
}

export async function getAdminBilling(): Promise<AdminBilling | null> {
  if (env.useMocks) return null;
  try {
    return await adminFetch<AdminBilling>("/v1/admin/billing");
  } catch {
    return null;
  }
}

// ── Dashboard KPI mappers ─────────────────────────────────────────────────────

interface ApiKpiRaw {
  // Flat numeric object (most likely backend shape)
  salesToday?: number; totalToday?: number; revenueToday?: number;
  ordersToday?: number; orderCountToday?: number;
  salesMonth?: number; totalMonth?: number; revenueMonth?: number;
  ordersMonth?: number; orderCountMonth?: number;
  activeSubscriptions?: number; subscriptionsActive?: number; subscriptionCount?: number;
  lowStockCount?: number; stockAlerts?: number; lowStockProducts?: number;
  salesDeltaPct?: number; todayGrowthPct?: number; growthToday?: number;
  salesMonthDeltaPct?: number; monthGrowthPct?: number; growthMonth?: number;
  subscriptionsDeltaPct?: number; subsGrowthPct?: number;
  lowStockDelta?: number;
}

function mapApiKpis(raw: unknown): AdminKpi[] {
  // If the API already returns an array of {label, value} objects, use it directly.
  if (Array.isArray(raw) && raw.length > 0 && typeof (raw[0] as Record<string,unknown>).label === "string") {
    return raw as AdminKpi[];
  }
  // Otherwise treat as a flat numeric object and build the 4 KPI cards.
  const d = (raw ?? {}) as ApiKpiRaw;
  const salesToday = d.salesToday ?? d.totalToday ?? d.revenueToday ?? 0;
  const ordersToday = d.ordersToday ?? d.orderCountToday ?? 0;
  const salesMonth = d.salesMonth ?? d.totalMonth ?? d.revenueMonth ?? 0;
  const ordersMonth = d.ordersMonth ?? d.orderCountMonth ?? 0;
  const activeSubs = d.activeSubscriptions ?? d.subscriptionsActive ?? d.subscriptionCount ?? 0;
  const lowStock = d.lowStockCount ?? d.stockAlerts ?? d.lowStockProducts ?? 0;

  const deltaFor = (pct: number | undefined, fallbackPct: number | undefined, fallback2?: number) => {
    const v = pct ?? fallbackPct ?? fallback2;
    if (v == null) return undefined;
    return { value: `${v >= 0 ? "+" : ""}${v}%`, positive: v >= 0 };
  };

  return [
    {
      label: "Ventas hoy",
      value: formatCop(salesToday),
      hint: `${ordersToday} pedidos`,
      delta: deltaFor(d.salesDeltaPct, d.todayGrowthPct, d.growthToday),
    },
    {
      label: "Ventas del mes",
      value: formatCop(salesMonth),
      hint: `${ordersMonth} pedidos`,
      delta: deltaFor(d.salesMonthDeltaPct, d.monthGrowthPct, d.growthMonth),
    },
    {
      label: "Suscripciones activas",
      value: String(activeSubs),
      delta: deltaFor(d.subscriptionsDeltaPct, d.subsGrowthPct),
    },
    {
      label: "Stock bajo",
      value: String(lowStock),
      hint: "Productos por debajo del umbral",
      delta: d.lowStockDelta != null
        ? { value: `${d.lowStockDelta >= 0 ? "+" : ""}${d.lowStockDelta}`, positive: d.lowStockDelta <= 0 }
        : undefined,
    },
  ];
}

// ── Alert mapper ──────────────────────────────────────────────────────────────

interface ApiAlertRaw {
  id?: string;
  severity?: string; level?: string; type?: string;
  title?: string; subject?: string;
  body?: string; description?: string; message?: string;
}

function mapApiAlert(a: ApiAlertRaw, i: number): AdminAlert {
  const severityRaw = (a.severity ?? a.level ?? a.type ?? "info").toLowerCase();
  const severity: AdminAlert["severity"] =
    severityRaw === "danger" || severityRaw === "error" || severityRaw === "critical" ? "danger"
    : severityRaw === "warning" || severityRaw === "warn" ? "warning"
    : "info";
  return {
    id: a.id ?? String(i),
    severity,
    title: a.title ?? a.subject ?? "Alerta",
    body: a.body ?? a.description ?? a.message ?? "",
  };
}

// ── Sales chart mapper ────────────────────────────────────────────────────────

interface ApiSalesPoint {
  date?: string; day?: string;
  total?: number; amount?: number; revenue?: number; value?: number;
}

function mapApiSales(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    // number[] directly
    if (raw.length === 0 || typeof raw[0] === "number") return raw as number[];
    // [{date, total}] format
    return (raw as ApiSalesPoint[]).map(
      (p) => p.total ?? p.amount ?? p.revenue ?? p.value ?? 0,
    );
  }
  // {data: number[]} or {points: [...]}
  const obj = raw as Record<string, unknown>;
  const arr = obj.data ?? obj.points ?? obj.sales ?? obj.items;
  if (Array.isArray(arr)) return mapApiSales(arr);
  return [];
}

// ── Customer mapper ───────────────────────────────────────────────────────────

interface ApiAdminCustomer {
  id?: string;
  name?: string; fullName?: string; firstName?: string; lastName?: string;
  email?: string;
  ordersCount?: number; orders?: number; orderCount?: number;
  totalSpentCents?: number; totalSpent?: number; lifetimeValue?: number;
  activeSubsCount?: number; activeSubscriptions?: number; subscriptionsCount?: number;
  joinedAt?: string; createdAt?: string; memberSince?: string;
}

function formatJoinDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", { month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function mapApiCustomer(c: ApiAdminCustomer): AdminCustomer {
  const firstName = c.firstName ?? "";
  const lastName = c.lastName ?? "";
  const fullName = c.name ?? c.fullName ?? (firstName || lastName ? `${firstName} ${lastName}`.trim() : "—");
  const totalCents = c.totalSpentCents ?? c.totalSpent ?? c.lifetimeValue ?? 0;
  return {
    id: c.id ?? "",
    name: fullName,
    email: c.email ?? "—",
    ordersCount: c.ordersCount ?? c.orders ?? c.orderCount ?? 0,
    totalSpentCents: totalCents,
    activeSubsCount: c.activeSubsCount ?? c.activeSubscriptions ?? c.subscriptionsCount ?? 0,
    joinedAt: formatJoinDate(c.joinedAt ?? c.createdAt ?? c.memberSince),
  };
}

// ── Admin Order & Subscription mappers ────────────────────────────────────────

export type AdminPaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

const PAYMENT_STATUSES: AdminPaymentStatus[] = ["PAID", "PENDING", "FAILED", "REFUNDED"];

function toPaymentStatus(raw: unknown): AdminPaymentStatus {
  const v = String(raw ?? "").toUpperCase() as AdminPaymentStatus;
  return PAYMENT_STATUSES.includes(v) ? v : "PENDING";
}

export interface AdminOrderRow {
  id: string;
  customer: string;
  totalCents: number;
  status: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: AdminPaymentStatus;
  createdAt: string;
  fromSub: boolean;
}

interface ApiAdminOrder extends ApiOrder {
  fromSubscription?: boolean;
  subscriptionId?: string | null;
}

const ADMIN_ORDER_STATUS_MAP: Record<string, AdminOrderRow["status"]> = {
  RECEIVED: "PROCESSING",
  PREPARING: "PROCESSING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function mapAdminOrderRow(o: ApiAdminOrder): AdminOrderRow {
  return {
    id: o.id,
    customer: o.customer?.name ?? o.customer?.email ?? "—",
    totalCents: o.totalCents ?? o.total ?? 0,
    status: ADMIN_ORDER_STATUS_MAP[o.status ?? ""] ?? "PROCESSING",
    paymentStatus: toPaymentStatus(o.paymentStatus),
    createdAt: ago(o.createdAt),
    fromSub: o.fromSubscription ?? Boolean(o.subscriptionId),
  };
}

export interface AdminSubscriptionRow {
  id: string;
  customer: string;
  productName: string;
  variantLabel: string;
  frequencyDays: number;
  nextShipAt: string;
  status: "ACTIVE" | "PAUSED" | "PAYMENT_FAILED" | "CANCELLED";
  unitPriceCents: number;
}

interface ApiAdminSubscription {
  id: string;
  customer?: { name?: string; email?: string } | null;
  customerName?: string;
  product?: { name?: string } | null;
  productName?: string;
  variantLabel?: string;
  variant?: { sizeGrams?: number; grind?: string } | null;
  frequencyDays?: number;
  nextShipAt?: string | null;
  nextDeliveryAt?: string | null;
  status?: string;
  unitPriceCents?: number;
  unitPrice?: number;
}

const ADMIN_SUB_STATUS_MAP: Record<string, AdminSubscriptionRow["status"]> = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  SKIPPED_NEXT: "ACTIVE",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CANCELLED: "CANCELLED",
};

function mapAdminSubscription(s: ApiAdminSubscription): AdminSubscriptionRow {
  const grindLabel: Record<string, string> = {
    WHOLE_BEAN: "Grano",
    ESPRESSO: "Espresso",
    FILTER: "Filtro",
    FRENCH_PRESS: "Prensa",
  };
  let variantLabel = s.variantLabel ?? "";
  if (!variantLabel && s.variant) {
    const size = s.variant.sizeGrams
      ? s.variant.sizeGrams >= 1000
        ? `${s.variant.sizeGrams / 1000} kg`
        : `${s.variant.sizeGrams} g`
      : "";
    const grind = grindLabel[s.variant.grind ?? ""] ?? "";
    variantLabel = [size, grind].filter(Boolean).join(" · ");
  }
  const status = ADMIN_SUB_STATUS_MAP[s.status ?? ""] ?? "ACTIVE";
  const nextIso = s.nextShipAt ?? s.nextDeliveryAt;
  const nextShipAt =
    status === "PAUSED" || !nextIso
      ? "—"
      : new Date(nextIso).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
        });

  return {
    id: s.id,
    customer: s.customerName ?? s.customer?.name ?? s.customer?.email ?? "—",
    productName: s.productName ?? s.product?.name ?? "Café",
    variantLabel,
    frequencyDays: s.frequencyDays ?? 14,
    nextShipAt,
    status,
    unitPriceCents: s.unitPriceCents ?? Math.round(s.unitPrice ?? 0),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getDashboardKpis(): Promise<AdminKpi[]> {
  if (env.useMocks) return ADMIN_KPIS;
  try {
    const data = await adminFetch<unknown>("/v1/admin/dashboard/kpis");
    return mapApiKpis(data ?? {});
  } catch {
    return mapApiKpis({});
  }
}

export async function getDashboardAlerts(): Promise<AdminAlert[]> {
  if (env.useMocks) return ADMIN_ALERTS;
  try {
    const raw = await adminFetch<unknown>("/v1/admin/dashboard/alerts");
    if (!raw) return [];
    const arr: ApiAlertRaw[] = Array.isArray(raw)
      ? (raw as ApiAlertRaw[])
      : ((raw as Record<string, unknown>).items as ApiAlertRaw[] ?? []);
    return arr.map(mapApiAlert);
  } catch {
    return [];
  }
}

export async function getSalesLast14d(): Promise<number[]> {
  if (env.useMocks) return SALES_LAST_14D;
  try {
    const raw = await adminFetch<unknown>("/v1/admin/dashboard/sales?days=14");
    if (!raw) return Array(14).fill(0);
    const mapped = mapApiSales(raw);
    return mapped.length > 0 ? mapped : Array(14).fill(0);
  } catch {
    return Array(14).fill(0);
  }
}

export async function listAdminCustomers(q?: string): Promise<AdminCustomer[]> {
  const term = q?.trim() ?? "";
  if (env.useMocks) {
    const needle = term.toLocaleLowerCase("es");
    return needle
      ? ADMIN_CUSTOMERS.filter(
          (c) =>
            c.name.toLocaleLowerCase("es").includes(needle) ||
            c.email.toLocaleLowerCase("es").includes(needle),
        )
      : ADMIN_CUSTOMERS;
  }
  try {
    const raw = await adminFetch<unknown>(
      term ? `/v1/admin/customers?q=${encodeURIComponent(term)}` : "/v1/admin/customers",
    );
    if (!raw) return [];
    const arr: ApiAdminCustomer[] = Array.isArray(raw)
      ? (raw as ApiAdminCustomer[])
      : ((raw as Record<string, unknown>).items as ApiAdminCustomer[]
          ?? (raw as Record<string, unknown>).data as ApiAdminCustomer[]
          ?? []);
    return arr.map(mapApiCustomer);
  } catch {
    return [];
  }
}

export async function getRecentOrders(): Promise<AdminRecentOrder[]> {
  if (env.useMocks) return ADMIN_RECENT_ORDERS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/orders", {
      params: { query: { limit: 5 } },
    });
    if (error || !data) return [];
    return items<ApiOrder>(data).slice(0, 5).map(mapOrder);
  } catch {
    return [];
  }
}

export async function listAdminOrders(): Promise<AdminOrderRow[]> {
  if (env.useMocks) {
    return ADMIN_RECENT_ORDERS.map((o) => ({
      id: o.id,
      customer: o.customer,
      totalCents: o.totalCents,
      status: o.status,
      paymentStatus: "PAID" as const,
      createdAt: o.createdAt,
      fromSub: false,
    }));
  }
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/orders", {
      params: { query: { limit: 50 } },
    });
    if (error || !data) return [];
    return items<ApiAdminOrder>(data).map(mapAdminOrderRow);
  } catch {
    return [];
  }
}

export async function listAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  if (env.useMocks) {
    const { MOCK_SUBSCRIPTIONS } = await import("../mocks/account");
    const sampleCustomers = ["María Restrepo", "Andrés P.", "Clara T."];
    return MOCK_SUBSCRIPTIONS.map((s, idx) => ({
      id: s.id,
      customer: sampleCustomers[idx % sampleCustomers.length],
      productName: s.productName,
      variantLabel: s.variantLabel,
      frequencyDays: s.frequencyDays,
      nextShipAt: s.nextShipAt,
      status: s.status,
      unitPriceCents: s.unitPriceCents,
    }));
  }
  try {
    const raw = await adminFetch<unknown>("/v1/admin/subscriptions");
    if (!raw) return [];
    return items<ApiAdminSubscription>(raw).map(mapAdminSubscription);
  } catch {
    return [];
  }
}

export async function listPendingReviews(): Promise<AdminReview[]> {
  if (env.useMocks) return ADMIN_REVIEWS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/reviews", {
      params: { query: { status: "PENDING" } },
    });
    if (error || !data) return [];
    return items<ApiReview>(data).map(mapReview);
  } catch {
    return [];
  }
}

/**
 * Reseñas de todos los estados para la pantalla de moderación (la API filtra
 * por un estado a la vez; sin filtro devuelve solo las pendientes).
 */
export async function listAdminReviews(): Promise<AdminReview[]> {
  if (env.useMocks) return ADMIN_REVIEWS;
  const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;
  const pages = await Promise.all(
    statuses.map((s) =>
      adminFetch<unknown>(`/v1/admin/reviews?status=${s}`).catch(() => null),
    ),
  );
  return pages.flatMap((p) => (p ? items<ApiReview>(p).map(mapReview) : []));
}

export async function listDiscountCodes(): Promise<AdminDiscountCode[]> {
  if (env.useMocks) return ADMIN_DISCOUNTS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/discount-codes");
    if (error || !data) return [];
    return items<ApiDiscountCode>(data).map(mapDiscount);
  } catch {
    return [];
  }
}

export interface AdminShippingAddress {
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface AdminOrderDetailData {
  id: string;
  createdAt: string;
  status: "RECEIVED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: AdminPaymentStatus;
  fromSubscription: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine: string;
  shippingCity: string;
  /** Dirección completa tal como la guardó el pedido (para corregirla). */
  shippingAddress: AdminShippingAddress;
  trackingNumber: string;
  /** Guías de Envia del pedido, la más reciente primero. */
  shipments: AdminShipment[];
  internalNotes: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  items: Array<{
    name: string;
    variant: string;
    qty: number;
    totalCents: number;
  }>;
}

/** Detalle del pedido para el panel; `null` si no existe en esta tienda. */
export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetailData | null> {
  if (!env.useMocks) {
    try {
      const raw = await adminFetch<Record<string, unknown>>(
        `/v1/admin/orders/${encodeURIComponent(id)}`,
      );
      if (raw && typeof raw.id === "string") {
        const customer = (raw.customer ?? {}) as {
          name?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
        };
        const addr = (raw.shippingAddress ?? {}) as {
          recipientName?: string;
          line1?: string;
          line2?: string;
          postalCode?: string;
          address?: string;
          city?: string;
          state?: string;
          region?: string;
          phone?: string;
        };
        const rawItems = Array.isArray(raw.items) ? raw.items : [];
        const mappedItems = rawItems.map((it: Record<string, unknown>) => {
          const qty = Number(it.qty ?? it.quantity ?? 1);
          const unitCents = Number(
            it.priceCents ?? it.unitCents ?? it.unitPrice ?? it.price ?? 0,
          );
          const lineCents = Number(it.lineCents ?? unitCents * qty);
          return {
            name: String(it.productName ?? "Café"),
            variant: String(it.variantLabel ?? it.variantName ?? it.variant ?? ""),
            qty,
            totalCents: lineCents,
          };
        });
        const totalCents = Number(raw.totalCents ?? raw.total ?? 0);
        const subtotalCents = Number(raw.subtotalCents ?? totalCents);
        const shippingCents = Number(raw.shippingCents ?? 0);
        const discountCents = Number(raw.discountCents ?? 0);
        const rawStatus = String(raw.status ?? "RECEIVED").toUpperCase();
        const status = (
          ["RECEIVED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(
            rawStatus,
          )
            ? rawStatus
            : "RECEIVED"
        ) as AdminOrderDetailData["status"];

        return {
          id: String(raw.id),
          createdAt: ago(typeof raw.createdAt === "string" ? raw.createdAt : undefined),
          status,
          paymentStatus: toPaymentStatus(raw.paymentStatus),
          fromSubscription: Boolean(raw.fromSubscription || raw.subscriptionId),
          customerName:
            [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
            customer.name ||
            customer.email ||
            "Cliente",
          customerEmail: customer.email ?? "—",
          customerPhone: customer.phone ?? addr.phone ?? "—",
          shippingLine: addr.line1 ?? addr.address ?? "—",
          shippingCity: [addr.city, addr.state ?? addr.region]
            .filter(Boolean)
            .join(", ") || "Colombia",
          shippingAddress: {
            recipientName: addr.recipientName ?? "",
            line1: addr.line1 ?? addr.address ?? "",
            line2: addr.line2 ?? "",
            city: addr.city ?? "",
            state: addr.state ?? addr.region ?? "",
            postalCode: addr.postalCode ?? "",
            phone: addr.phone ?? "",
          },
          // El backend guarda la guía en `trackingUrl` (número o enlace).
          trackingNumber: String(raw.trackingUrl ?? raw.trackingNumber ?? ""),
          shipments: Array.isArray(raw.shipments)
            ? (raw.shipments as Record<string, unknown>[]).map(mapAdminShipment)
            : [],
          internalNotes: String(raw.internalNotes ?? ""),
          subtotalCents,
          shippingCents,
          discountCents,
          totalCents,
          items: mappedItems,
        };
      }
    } catch {}
    // Sin datos reales no se inventa un pedido: la página muestra "no encontrado".
    return null;
  }

  return {
    id,
    createdAt: "Reciente",
    status: "PREPARING",
    paymentStatus: "PAID",
    fromSubscription: false,
    customerName: "Cliente Registrado",
    customerEmail: "cliente@bestcoffee.io",
    customerPhone: "—",
    shippingLine: "Dirección registrada en el pedido",
    shippingCity: "Bogotá, Colombia",
    shippingAddress: {
      recipientName: "Cliente Registrado",
      line1: "Dirección registrada en el pedido",
      line2: "",
      city: "Bogotá",
      state: "Cundinamarca",
      postalCode: "",
      phone: "",
    },
    trackingNumber: "",
    shipments: [],
    internalNotes: "",
    subtotalCents: 116_000_00,
    shippingCents: 0,
    discountCents: 0,
    totalCents: 116_000_00,
    items: [
      {
        name: "Mezcla del alba",
        variant: "250 g · Molido filtro",
        qty: 2,
        totalCents: 116_000_00,
      },
    ],
  };
}

export async function listAuditEntries(): Promise<AdminAuditEntry[]> {
  if (env.useMocks) return ADMIN_AUDIT;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/audit-logs");
    if (error || !data) return [];
    return items<ApiAuditEntry>(data).map(mapAudit);
  } catch {
    return [];
  }
}

// ── Productos del panel (incluye borradores y archivados) ────────────────────

interface ApiAdminProductListItem {
  id: string;
}

/**
 * Catálogo completo de la tienda para el panel. `GET /v1/admin/products`
 * trae todos los estados pero sin variantes (páginas de 25); el detalle de
 * cada producto (`GET /v1/admin/products/:id`) trae variantes e imágenes.
 */
export async function listAdminProducts(): Promise<Product[]> {
  if (env.useMocks) {
    const { listProducts } = await import("./products");
    return listProducts();
  }
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page++) {
    const qs: string = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const res: { items?: ApiAdminProductListItem[]; nextCursor?: string | null } | null =
      await adminFetch(`/v1/admin/products${qs}`);
    if (!res) break;
    ids.push(...(res.items ?? []).map((p) => p.id));
    cursor = res.nextCursor ?? null;
    if (!cursor) break;
  }
  const details = await Promise.all(ids.map((id) => getAdminProduct(id)));
  return details.filter((p): p is Product => p !== null);
}

/** Producto con variantes (precios en centavos) para editarlo; `null` si no es de esta tienda. */
export async function getAdminProduct(id: string): Promise<Product | null> {
  if (env.useMocks) {
    const { listProducts } = await import("./products");
    return (await listProducts()).find((p) => p.id === id) ?? null;
  }
  const raw = await adminFetch<ApiProduct>(`/v1/admin/products/${encodeURIComponent(id)}`).catch(
    () => null,
  );
  return raw && typeof raw.id === "string" ? mapProduct(raw) : null;
}

// ── Configuración de la tienda (dueño) ───────────────────────────────────────

export interface AdminStoreSettings {
  name: string;
  freeShippingThresholdCents: number | null;
  shippingFlatCents: number | null;
  legalName: string;
  legalId: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
}

/** `GET /v1/admin/settings` (solo el dueño). `null` si no hay permiso o falla. */
export async function getAdminSettings(): Promise<AdminStoreSettings | null> {
  if (env.useMocks) return null;
  const raw = await adminFetch<{
    name?: string;
    features?: Record<string, unknown> | null;
    branding?: Record<string, unknown> | null;
  }>("/v1/admin/settings").catch(() => null);
  if (!raw) return null;
  const f = raw.features ?? {};
  const b = raw.branding ?? {};
  const num = (v: unknown) => (typeof v === "number" ? v : null);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    name: raw.name ?? "",
    freeShippingThresholdCents: num(f.freeShippingThresholdCents),
    shippingFlatCents: num(f.shippingFlatCents),
    legalName: str(b.legalName),
    legalId: str(b.legalId),
    contactEmail: str(b.contactEmail),
    contactPhone: str(b.contactPhone),
    city: str(b.city),
  };
}

export interface EpaycoStatus {
  connected: boolean;
  /** P_CUST_ID_CLIENTE (no es secreto). */
  customerId: string | null;
  publicKey: string | null;
  /** Entorno de pruebas de ePayco. */
  test: boolean;
  /** Conectada y elegida como pasarela de la tienda. */
  active: boolean;
}

/** Estado de ePayco de la tienda (las llaves secretas nunca vuelven al front). */
export async function getEpaycoStatus(): Promise<EpaycoStatus | null> {
  if (env.useMocks) return null;
  return adminFetch<EpaycoStatus>("/v1/admin/epayco/status").catch(() => null);
}
