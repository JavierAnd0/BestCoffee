import { env } from "../env";
import { apiServer } from "../api/client";
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

// ── Public API ─────────────────────────────────────────────────────────────────
// KPIs and alerts have no dedicated endpoint yet → always mock.

export async function getDashboardKpis(): Promise<AdminKpi[]> {
  return ADMIN_KPIS;
}

export async function getDashboardAlerts(): Promise<AdminAlert[]> {
  return ADMIN_ALERTS;
}

export async function getSalesLast14d(): Promise<number[]> {
  return SALES_LAST_14D;
}

// No /v1/admin/customers endpoint yet → always mock.
export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  return ADMIN_CUSTOMERS;
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
