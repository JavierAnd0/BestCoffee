import { env } from "../env";
import {
  MOCK_CUSTOMER,
  MOCK_ADDRESSES,
  MOCK_ORDERS,
  MOCK_SUBSCRIPTIONS,
  type MockCustomer,
  type MockAddress,
  type MockOrder,
  type MockSubscription,
  type OrderStatus,
  type SubStatus,
} from "../mocks/account";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function authHeaders() {
  const { cookies, headers } = await import("next/headers");
  const c = await cookies();
  const h = await headers();
  const token =
    c.get("bestcoffee-session")?.value ?? c.get("customer_token")?.value;
  return {
    token,
    tenantSlug: h.get("x-tenant-slug") ?? "origen",
  };
}

function items<T>(payload: unknown): T[] {
  const p = payload as { items?: T[]; data?: T[] } | T[];
  if (Array.isArray(p)) return p;
  return p?.items ?? p?.data ?? [];
}

// ── Customer profile ──────────────────────────────────────────────────────────

interface ApiCustomer {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  createdAt?: string | null;
}

function mapCustomer(c: ApiCustomer): MockCustomer {
  const fullName =
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    c.name?.trim() ||
    c.email;
  return {
    name: fullName,
    email: c.email,
    phone: c.phone ?? "",
    memberSince: c.createdAt
      ? new Date(c.createdAt).getFullYear().toString()
      : "—",
  };
}

async function fetchMe(): Promise<MockCustomer | null> {
  const { token, tenantSlug } = await authHeaders();
  if (!token) return null;
  const res = await fetch(`${env.apiUrlInternal}/v1/customers/me`, {
    headers: {
      "X-Tenant-Slug": tenantSlug,
      Authorization: `Bearer ${token}`,
      Cookie: `customer_token=${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return mapCustomer((await res.json()) as ApiCustomer);
}

export async function getCurrentCustomer(): Promise<MockCustomer> {
  if (env.useMocks) return MOCK_CUSTOMER;
  try {
    return (await fetchMe()) ?? MOCK_CUSTOMER;
  } catch {
    return MOCK_CUSTOMER;
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

interface ApiOrderItem {
  id?: string;
  productName?: string;
  variantLabel?: string;
  variant?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  priceCents?: number;
  price?: number;
}

interface ApiOrder {
  id: string;
  createdAt?: string;
  status?: string;
  total?: number;
  totalCents?: number;
  itemsCount?: number;
  fromSubscription?: boolean;
  subscriptionId?: string | null;
  items?: ApiOrderItem[];
  shippingAddress?: {
    address?: string;
    city?: string;
    region?: string;
  } | null;
}

// API uses RECEIVED/PREPARING; map to the frontend's PROCESSING bucket
const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  RECEIVED: "PROCESSING",
  PREPARING: "PROCESSING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function formatOrderDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapOrder(o: ApiOrder): MockOrder {
  const itemsCount =
    o.itemsCount ?? o.items?.length ?? 1;
  const totalCents =
    o.totalCents ?? (o.total ? Math.round(o.total) : 0);
  return {
    id: o.id,
    createdAt: formatOrderDate(o.createdAt),
    itemsCount,
    totalCents,
    status: ORDER_STATUS_MAP[o.status ?? ""] ?? "PROCESSING",
    fromSubscription: o.fromSubscription ?? !!o.subscriptionId,
    items: (o.items ?? []).map((i) => ({
      name: i.productName ?? "Café ORÍGEN",
      variant: i.variantLabel ?? i.variant ?? "",
      qty: i.qty ?? i.quantity ?? 1,
      priceCents: i.priceCents ?? i.unitPrice ?? i.price ?? 0,
    })),
    shippingAddress: o.shippingAddress
      ? `${o.shippingAddress.address ?? ""}, ${o.shippingAddress.city ?? ""}`.trim().replace(/^,\s*/, "")
      : undefined,
  };
}

export async function getCustomerOrders(): Promise<MockOrder[]> {
  if (env.useMocks) return MOCK_ORDERS;
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return [];
    const res = await fetch(`${env.apiUrlInternal}/v1/orders`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return MOCK_ORDERS;
    const data = await res.json();
    const list = items<ApiOrder>(data);
    return list.map(mapOrder);
  } catch {
    return MOCK_ORDERS;
  }
}

export async function getCustomerOrder(id: string): Promise<MockOrder | null> {
  if (env.useMocks) {
    return MOCK_ORDERS.find((o) => o.id === id) ?? null;
  }
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return null;
    const res = await fetch(`${env.apiUrlInternal}/v1/orders/${encodeURIComponent(id)}`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return mapOrder((await res.json()) as ApiOrder);
  } catch {
    return null;
  }
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

interface ApiSubscription {
  id: string;
  product?: { slug?: string; name?: string } | null;
  productSlug?: string;
  productName?: string;
  variantLabel?: string;
  variant?: { label?: string; sizeGrams?: number; grind?: string } | null;
  unitPrice?: number;
  unitPriceCents?: number;
  frequencyDays?: number;
  status?: string;
  nextShipAt?: string | null;
  nextDeliveryAt?: string | null;
}

const SUB_STATUS_MAP: Record<string, SubStatus> = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  SKIPPED_NEXT: "ACTIVE",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CANCELLED: "CANCELLED",
};

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

function daysUntil(iso?: string | null): number {
  if (!iso) return -1;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(-1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function mapSubscription(s: ApiSubscription): MockSubscription {
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

  const nextShipAt = s.nextShipAt ?? s.nextDeliveryAt ?? null;
  const status = SUB_STATUS_MAP[s.status ?? ""] ?? "ACTIVE";

  return {
    id: s.id,
    productSlug: s.productSlug ?? s.product?.slug ?? "",
    productName: s.productName ?? s.product?.name ?? "Café ORÍGEN",
    variantLabel,
    unitPriceCents: s.unitPriceCents ?? Math.round((s.unitPrice ?? 0)),
    frequencyDays: s.frequencyDays ?? 14,
    status,
    nextShipAt: status === "PAUSED" ? "—" : formatShortDate(nextShipAt),
    daysUntilNext: status === "PAUSED" ? -1 : daysUntil(nextShipAt),
  };
}

export async function getCustomerSubscriptions(): Promise<MockSubscription[]> {
  if (env.useMocks) return MOCK_SUBSCRIPTIONS;
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return [];
    const res = await fetch(`${env.apiUrlInternal}/v1/subscriptions`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return MOCK_SUBSCRIPTIONS;
    const data = await res.json();
    const list = items<ApiSubscription>(data);
    return list.map(mapSubscription);
  } catch {
    return MOCK_SUBSCRIPTIONS;
  }
}

// ── Addresses ─────────────────────────────────────────────────────────────────

interface ApiAddress {
  id: string;
  label?: string;
  name?: string;
  alias?: string;
  address?: string;
  line?: string;
  street?: string;
  city?: string;
  isDefault?: boolean;
  default?: boolean;
}

function mapAddress(a: ApiAddress): MockAddress {
  const city = a.city ? `, ${a.city}` : "";
  const street = a.address ?? a.line ?? a.street ?? "";
  return {
    id: a.id,
    label: a.label ?? a.name ?? a.alias ?? "Dirección",
    line: `${street}${city}`.trim(),
    isDefault: a.isDefault ?? a.default ?? false,
  };
}

export async function getCustomerAddresses(): Promise<MockAddress[]> {
  if (env.useMocks) return MOCK_ADDRESSES;
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return [];
    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return MOCK_ADDRESSES;
    const data = await res.json();
    const list = items<ApiAddress>(data);
    if (list.length === 0) return MOCK_ADDRESSES;
    return list.map(mapAddress);
  } catch {
    return MOCK_ADDRESSES;
  }
}
