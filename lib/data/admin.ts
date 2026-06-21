import { env } from "../env";
import { apiServer } from "../api/client";
import { formatCop } from "../format";
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

// ── Minimal shapes the backend returns (best-effort; cast at call sites) ─────

interface ApiOrder {
  id: string;
  customer?: { name?: string; email?: string } | null;
  totalCents?: number;
  total?: number;
  status?: string;
  createdAt?: string;
}

interface ApiReview {
  id: string;
  customer?: { name?: string } | null;
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

interface ApiDiscountCode {
  id: string;
  code?: string;
  type?: string;
  discountPct?: number;
  discountAmount?: number;
  value?: string | number;
  appliesTo?: string;
  usesCount?: number;
  usesLimit?: number;
  expiresAt?: string | null;
  active?: boolean;
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
    status: (o.status as AdminRecentOrder["status"]) ?? "PROCESSING",
    createdAt: ago(o.createdAt),
  };
}

function mapReview(r: ApiReview): AdminReview {
  return {
    id: r.id,
    customerName: r.customerName ?? r.customer?.name ?? "—",
    productName: r.productName ?? r.product?.name ?? "—",
    rating: r.rating ?? 5,
    body: r.body ?? r.comment ?? "",
    status: (r.status as AdminReview["status"]) ?? "PENDING",
    createdAt: ago(r.createdAt),
    verifiedSubscriber: r.verifiedSubscriber ?? false,
  };
}

function mapDiscount(d: ApiDiscountCode): AdminDiscountCode {
  const typeKey = (d.type ?? "PERCENT") as AdminDiscountCode["type"];
  const valueStr =
    typeof d.value === "string"
      ? d.value
      : d.discountPct != null
        ? `${d.discountPct}%`
        : d.discountAmount != null
          ? `$${(d.discountAmount / 100).toLocaleString("es-CO")}`
          : "—";
  return {
    id: d.id,
    code: d.code ?? "",
    type: typeKey,
    value: valueStr,
    appliesTo: d.appliesTo ?? "Todos los productos",
    usesCount: d.usesCount ?? 0,
    usesLimit: d.usesLimit,
    expiresAt: d.expiresAt ?? undefined,
    active: d.active ?? true,
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
  const token = c.get("bestcoffee-session")?.value ?? null;
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug") ?? process.env.DEFAULT_TENANT_SLUG ?? "origen";

  const res = await fetch(`${env.apiUrlInternal}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Slug": tenantSlug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
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

// ── Public API ──────────────────────────────────────────────────────────────

export async function getDashboardKpis(): Promise<AdminKpi[]> {
  if (env.useMocks) return ADMIN_KPIS;
  try {
    const data = await adminFetch<unknown>("/v1/admin/dashboard/kpis");
    if (!data) return ADMIN_KPIS;
    const mapped = mapApiKpis(data);
    return mapped.length > 0 ? mapped : ADMIN_KPIS;
  } catch {
    return ADMIN_KPIS;
  }
}

export async function getDashboardAlerts(): Promise<AdminAlert[]> {
  if (env.useMocks) return ADMIN_ALERTS;
  try {
    const raw = await adminFetch<unknown>("/v1/admin/dashboard/alerts");
    if (!raw) return ADMIN_ALERTS;
    const arr: ApiAlertRaw[] = Array.isArray(raw)
      ? (raw as ApiAlertRaw[])
      : ((raw as Record<string, unknown>).items as ApiAlertRaw[] ?? []);
    return arr.length > 0 ? arr.map(mapApiAlert) : ADMIN_ALERTS;
  } catch {
    return ADMIN_ALERTS;
  }
}

export async function getSalesLast14d(): Promise<number[]> {
  if (env.useMocks) return SALES_LAST_14D;
  try {
    const raw = await adminFetch<unknown>("/v1/admin/dashboard/sales?days=14");
    if (!raw) return SALES_LAST_14D;
    const mapped = mapApiSales(raw);
    return mapped.length > 0 ? mapped : SALES_LAST_14D;
  } catch {
    return SALES_LAST_14D;
  }
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  if (env.useMocks) return ADMIN_CUSTOMERS;
  try {
    const raw = await adminFetch<unknown>("/v1/admin/customers");
    if (!raw) return ADMIN_CUSTOMERS;
    const arr: ApiAdminCustomer[] = Array.isArray(raw)
      ? (raw as ApiAdminCustomer[])
      : ((raw as Record<string, unknown>).items as ApiAdminCustomer[]
          ?? (raw as Record<string, unknown>).data as ApiAdminCustomer[]
          ?? []);
    return arr.length > 0 ? arr.map(mapApiCustomer) : ADMIN_CUSTOMERS;
  } catch {
    return ADMIN_CUSTOMERS;
  }
}

export async function getRecentOrders(): Promise<AdminRecentOrder[]> {
  if (env.useMocks) return ADMIN_RECENT_ORDERS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/orders", {
      params: { query: { limit: 5 } },
    });
    if (error || !data) return ADMIN_RECENT_ORDERS;
    return items<ApiOrder>(data).slice(0, 5).map(mapOrder);
  } catch {
    return ADMIN_RECENT_ORDERS;
  }
}

export async function listPendingReviews(): Promise<AdminReview[]> {
  if (env.useMocks) return ADMIN_REVIEWS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/reviews", {
      params: { query: { status: "PENDING" } },
    });
    if (error || !data) return ADMIN_REVIEWS;
    return items<ApiReview>(data).map(mapReview);
  } catch {
    return ADMIN_REVIEWS;
  }
}

export async function listDiscountCodes(): Promise<AdminDiscountCode[]> {
  if (env.useMocks) return ADMIN_DISCOUNTS;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/discount-codes");
    if (error || !data) return ADMIN_DISCOUNTS;
    return items<ApiDiscountCode>(data).map(mapDiscount);
  } catch {
    return ADMIN_DISCOUNTS;
  }
}

export async function listAuditEntries(): Promise<AdminAuditEntry[]> {
  if (env.useMocks) return ADMIN_AUDIT;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/admin/audit-logs");
    if (error || !data) return ADMIN_AUDIT;
    return items<ApiAuditEntry>(data).map(mapAudit);
  } catch {
    return ADMIN_AUDIT;
  }
}
