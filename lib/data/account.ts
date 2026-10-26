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

// ── Neon User Extraction ───────────────────────────────────────────────────

interface NeonUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  createdAt?: string | Date | null;
}

function decodeJwtPayload(token: string): {
  sub?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  user?: { id?: string; name?: string; email?: string; image?: string };
  iat?: number;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    }
  } catch {}
  return null;
}

async function getNeonUser(): Promise<NeonUser | null> {
  try {
    const { cookies } = await import("next/headers");
    const c = await cookies();

    // 1. Decodificar la cookie oficial de sesión de Neon Auth (__Secure- primero)
    const sessionDataCookies = [
      c.get("__Secure-neon-auth.local.session_data")?.value,
      c.get("neon-auth.local.session_data")?.value,
    ];

    for (const val of sessionDataCookies) {
      if (!val) continue;
      const payload = decodeJwtPayload(val);
      if (payload) {
        const email = payload.user?.email || payload.email;
        const name =
          payload.user?.name ||
          payload.name ||
          (email
            ? email
                .split("@")[0]
                .replace(/[._]/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())
            : undefined);
        const userId = payload.user?.id || payload.sub;
        if (email) {
          return { email, name, id: userId };
        }
      }
    }

    // 2. Consultar el endpoint /get-session de Neon Auth únicamente con el session_token actual
    const sessionToken =
      c.get("__Secure-neon-auth.session_token")?.value ??
      c.get("neon-auth.session_token")?.value;

    if (sessionToken && env.neonAuthUrl) {
      try {
        const res = await fetch(`${env.neonAuthUrl}/get-session`, {
          headers: {
            Cookie: `__Secure-neon-auth.session_token=${sessionToken}; neon-auth.session_token=${sessionToken}`,
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { user?: NeonUser } | null;
          if (data?.user && (data.user.name || data.user.email)) {
            return data.user;
          }
        }
      } catch {}
    }

    // 3. Fallback vía SDK de servidor si está configurado
    if (env.neonAuthUrl) {
      try {
        const { auth } = await import("../auth/server");
        const sessionRes = (await auth.getSession()) as {
          data?: { user?: NeonUser };
          user?: NeonUser;
          session?: { user?: NeonUser };
        } | null;
        const u =
          sessionRes?.data?.user ??
          sessionRes?.user ??
          sessionRes?.session?.user;
        if (u && (u.name || u.email)) {
          return u as NeonUser;
        }
      } catch {}
    }
  } catch {}

  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function authHeaders() {
  const { cookies, headers } = await import("next/headers");
  const c = await cookies();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug") ?? env.defaultTenantSlug;

  let token =
    c.get("bestcoffee-session")?.value ??
    c.get("customer_token")?.value;

  if (token === "mock-session-test") {
    return { token, tenantSlug };
  }

  // Verificar si existe una sesión de Neon Auth (Google OAuth) y asegurar que el token
  // de backend corresponda exactamente al usuario activo de Neon Auth.
  try {
    const neonUser = await getNeonUser();
    if (neonUser?.email) {
      const tokenPayload = token ? decodeJwtPayload(token) : null;
      const tokenEmail = tokenPayload?.user?.email || tokenPayload?.email;
      const isLocalFallback = token?.endsWith(".local_session") ?? false;
      const emailMismatch =
        Boolean(tokenEmail) &&
        tokenEmail!.toLowerCase() !== neonUser.email.toLowerCase();

      if (!token || isLocalFallback || emailMismatch) {
        const syncRes = await fetch(
          `${env.apiUrlInternal}/v1/auth/customer/neon-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
            },
            body: JSON.stringify({
              email: neonUser.email,
              name: neonUser.name,
            }),
            cache: "no-store",
          },
        );
        if (syncRes.ok) {
          const syncData = (await syncRes.json()) as { accessToken?: string };
          if (syncData.accessToken) {
            token = syncData.accessToken;
          }
        }
      }
    }
  } catch {}

  return {
    token,
    tenantSlug,
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
    (c.email
      ? c.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Cliente");
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
    const { cookies } = await import("next/headers");
    const c = await cookies();
    const rawToken =
      c.get("bestcoffee-session")?.value ??
      c.get("customer_token")?.value;

    if (rawToken === "mock-session-test") {
      return MOCK_CUSTOMER;
    }

    // 1. Obtener el cliente real desde el backend NestJS (incluye re-sync automático con Neon Auth en authHeaders)
    const me = await fetchMe();
    if (me) return me;

    // 2. Fallback si el backend está apagado pero existe sesión activa de Neon Auth (Google OAuth)
    const neonUser = await getNeonUser();
    if (neonUser && (neonUser.name || neonUser.email)) {
      const email = neonUser.email || "";
      const displayName =
        neonUser.name?.trim() ||
        (email
          ? email
              .split("@")[0]
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
          : "Cliente");

      const memberDate = neonUser.createdAt;
      const memberSince = memberDate
        ? new Date(memberDate).getFullYear().toString()
        : new Date().getFullYear().toString();

      return {
        name: displayName,
        email,
        phone: "",
        memberSince,
      };
    }

    // 3. Fallback decodificando el JWT de sesión si el backend está offline
    if (rawToken) {
      const payload = decodeJwtPayload(rawToken);
      if (payload && (payload.name || payload.email || payload.firstName)) {
        const fullName =
          payload.name ||
          [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
          (payload.email
            ? payload.email
                .split("@")[0]
                .replace(/[._]/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())
            : "Cliente");
        const memberSince = payload.iat
          ? new Date(payload.iat * 1000).getFullYear().toString()
          : new Date().getFullYear().toString();
        return {
          name: fullName,
          email: payload.email || "",
          phone: "",
          memberSince,
        };
      }
    }

    return {
      name: "Cliente",
      email: "",
      phone: "",
      memberSince: new Date().getFullYear().toString(),
    };
  } catch {
    return {
      name: "Cliente",
      email: "",
      phone: "",
      memberSince: new Date().getFullYear().toString(),
    };
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

interface ApiOrderItem {
  id?: string;
  productName?: string;
  variantLabel?: string;
  variantName?: string;
  variant?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  priceCents?: number;
  price?: number;
  lineCents?: number;
  unitCents?: number;
}

interface ApiOrder {
  id: string;
  createdAt?: string;
  status?: string;
  total?: number;
  totalCents?: number;
  subtotalCents?: number;
  discountCents?: number;
  shippingCents?: number;
  itemsCount?: number;
  _count?: { items?: number };
  fromSubscription?: boolean;
  subscriptionId?: string | null;
  items?: ApiOrderItem[];
  shippingAddress?: {
    address?: string;
    city?: string;
    region?: string;
    line1?: string;
    state?: string;
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
    o.itemsCount ?? o._count?.items ?? o.items?.length ?? 1;
  const totalCents =
    o.totalCents ?? (o.total ? Math.round(o.total) : 0);
  const items = (o.items ?? []).map((i) => ({
    name: i.productName ?? "Café",
    variant: i.variantLabel ?? i.variantName ?? i.variant ?? "",
    qty: i.qty ?? i.quantity ?? 1,
    priceCents: i.priceCents ?? i.lineCents ?? i.unitCents ?? i.unitPrice ?? i.price ?? 0,
  }));
  const itemsSum = items.reduce((acc, it) => acc + it.priceCents * it.qty, 0);
  const subtotalCents = o.subtotalCents ?? (itemsSum > 0 ? itemsSum : totalCents);
  const shippingCents = o.shippingCents ?? Math.max(0, totalCents - subtotalCents);
  const discountCents = o.discountCents ?? 0;

  return {
    id: o.id,
    createdAt: formatOrderDate(o.createdAt),
    itemsCount,
    totalCents,
    subtotalCents,
    shippingCents,
    discountCents,
    status: ORDER_STATUS_MAP[o.status ?? ""] ?? "PROCESSING",
    fromSubscription: o.fromSubscription ?? !!o.subscriptionId,
    items,
    shippingAddress: o.shippingAddress
      ? `${o.shippingAddress.address ?? o.shippingAddress.line1 ?? ""}, ${o.shippingAddress.city ?? ""}`.trim().replace(/^,\s*/, "")
      : undefined,
  };
}

export async function getCustomerOrders(): Promise<MockOrder[]> {
  if (env.useMocks) return MOCK_ORDERS;
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return [];
    if (token === "mock-session-test") return MOCK_ORDERS;
    const res = await fetch(`${env.apiUrlInternal}/v1/orders`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return items<ApiOrder>(data).map(mapOrder);
  } catch {
    return [];
  }
}

export async function getCustomerOrder(id: string): Promise<MockOrder | null> {
  if (env.useMocks) {
    return MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0] ?? null;
  }
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return null;
    if (token === "mock-session-test") {
      return MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0] ?? null;
    }
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
    productName: s.productName ?? s.product?.name ?? "Café",
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
    if (token === "mock-session-test") return MOCK_SUBSCRIPTIONS;
    const res = await fetch(`${env.apiUrlInternal}/v1/subscriptions`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return items<ApiSubscription>(data).map(mapSubscription);
  } catch {
    return [];
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
  line1?: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
  default?: boolean;
}

function mapAddress(a: ApiAddress): MockAddress {
  const line1 = a.line1 ?? a.address ?? a.line ?? a.street ?? "";
  const complement = a.line2 ? `, ${a.line2}` : "";
  const city = a.city ? `, ${a.city}` : "";
  const state = a.state ? `, ${a.state}` : "";
  return {
    id: a.id,
    label: a.label ?? a.name ?? a.alias ?? "Dirección",
    line: `${line1}${complement}${city}${state}`.trim(),
    line1,
    line2: a.line2 ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    postalCode: a.postalCode ?? "",
    country: a.country ?? "CO",
    phone: a.phone ?? "",
    isDefault: a.isDefault ?? a.default ?? false,
  };
}

export async function getCustomerAddresses(): Promise<MockAddress[]> {
  if (env.useMocks) return MOCK_ADDRESSES;
  try {
    const { token, tenantSlug } = await authHeaders();
    if (!token) return [];
    if (token === "mock-session-test") return MOCK_ADDRESSES;
    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses`, {
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return items<ApiAddress>(data).map(mapAddress);
  } catch {
    return [];
  }
}
