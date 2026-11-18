import { cache } from "react";
import { env } from "../env";
import { customerFetch } from "../api/gateway";
import {
  decodeJwtClaims,
  formatNameFromEmail,
  getCustomerSession,
} from "../auth/session-store";
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

export async function authHeaders() {
  const { token, tenantSlug } = await getCustomerSession();
  return { token, tenantSlug };
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
  newsletterOptIn?: boolean | null;
  createdAt?: string | null;
}

function mapCustomer(c: ApiCustomer): MockCustomer {
  const fullName =
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    c.name?.trim() ||
    formatNameFromEmail(c.email);
  return {
    name: fullName,
    email: c.email,
    phone: c.phone ?? "",
    newsletterOptIn: c.newsletterOptIn ?? true,
    memberSince: c.createdAt
      ? new Date(c.createdAt).getFullYear().toString()
      : "—",
  };
}

// Una sola consulta por petición: la comparten el layout de la cuenta (que exige
// sesión válida) y getCurrentCustomer.
const fetchMeResult = cache(() => customerFetch<ApiCustomer>("/v1/customers/me"));

async function fetchMe(): Promise<MockCustomer | null> {
  const res = await fetchMeResult();
  if (!res.ok || !res.data) return null;
  return mapCustomer(res.data);
}

/**
 * ¿La sesión del cliente es válida para el backend? Solo es falso cuando el
 * backend la RECHAZA (401/403): un token inventado o vencido. Si el backend no
 * responde, no se expulsa a nadie (el sitio entero estaría caído).
 */
export async function hasValidCustomerSession(): Promise<boolean> {
  if (env.useMocks) return true;
  const res = await fetchMeResult();
  return res.ok || (res.status !== 401 && res.status !== 403);
}

export async function getCurrentCustomer(): Promise<MockCustomer> {
  if (env.useMocks) return MOCK_CUSTOMER;

  try {
    const { token, isMockSession, neonUser } = await getCustomerSession();

    if (isMockSession) {
      return MOCK_CUSTOMER;
    }

    // 1. Obtener el cliente real desde el backend NestJS (incluye re-sync automático con Neon Auth)
    const me = await fetchMe();
    if (me) return me;

    // 2. Fallback si el backend está apagado pero existe sesión activa de Neon Auth (Google OAuth)
    if (neonUser && (neonUser.name || neonUser.email)) {
      const email = neonUser.email || "";
      const displayName = neonUser.name?.trim() || formatNameFromEmail(email);
      const memberDate = neonUser.createdAt;
      const memberSince = memberDate
        ? new Date(memberDate).getFullYear().toString()
        : new Date().getFullYear().toString();

      return {
        name: displayName,
        email,
        phone: "",
        memberSince,
        newsletterOptIn: true,
      };
    }

    // 3. Fallback decodificando el JWT de sesión si el backend está offline
    if (token) {
      const payload = decodeJwtClaims(token);
      if (payload && (payload.name || payload.email || payload.firstName)) {
        const fullName =
          payload.name ||
          [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
          formatNameFromEmail(payload.email);
        const memberSince = payload.iat
          ? new Date(payload.iat * 1000).getFullYear().toString()
          : new Date().getFullYear().toString();
        return {
          name: fullName,
          email: payload.email || "",
          phone: "",
          memberSince,
          newsletterOptIn: true,
        };
      }
    }

    return {
      name: "Cliente",
      email: "",
      phone: "",
      memberSince: new Date().getFullYear().toString(),
      newsletterOptIn: true,
    };
  } catch {
    return {
      name: "Cliente",
      email: "",
      phone: "",
      memberSince: new Date().getFullYear().toString(),
      newsletterOptIn: true,
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
  imageUrl?: string | null;
  imageAlt?: string | null;
  productSlug?: string | null;
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
    imageUrl: i.imageUrl ?? null,
    imageAlt: i.imageAlt ?? null,
    productSlug: i.productSlug ?? null,
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
  const { token, isMockSession } = await getCustomerSession();
  if (!token) return [];
  if (isMockSession) return MOCK_ORDERS;
  const res = await customerFetch<unknown>("/v1/orders");
  if (!res.ok) return [];
  return items<ApiOrder>(res.data).map(mapOrder);
}

export async function getCustomerOrder(id: string): Promise<MockOrder | null> {
  if (env.useMocks) {
    return MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0] ?? null;
  }
  const { token, isMockSession } = await getCustomerSession();
  if (!token) return null;
  if (isMockSession) {
    return MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0] ?? null;
  }
  const res = await customerFetch<ApiOrder>(`/v1/orders/${encodeURIComponent(id)}`);
  if (!res.ok || !res.data) return null;
  return mapOrder(res.data);
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

interface ApiSubscription {
  id: string;
  product?: { slug?: string; name?: string } | null;
  productSlug?: string;
  productName?: string;
  variantLabel?: string;
  variant?: {
    label?: string;
    sizeGrams?: number;
    grind?: string;
    priceSubscription?: number | null;
    priceOneTime?: number | null;
    product?: {
      slug?: string;
      name?: string;
      images?: Array<{ url: string; alt?: string | null }>;
    } | null;
  } | null;
  unitPrice?: number;
  unitPriceCents?: number;
  frequencyDays?: number;
  discountPct?: number;
  status?: string;
  nextShipAt?: string | null;
  nextDeliveryAt?: string | null;
  lastShippedAt?: string | null;
}

/**
 * Suscripción del cliente tal como la muestra la cuenta. Añade a la forma de
 * los datos de ejemplo lo que distingue el modelo real de "pedidos sin pagos".
 */
export interface CustomerSubscription extends MockSubscription {
  /** Nació con un pedido que aún no se ha pagado: se activa al confirmarse el pago. */
  awaitingFirstPayment?: boolean;
  /** El próximo envío está saltado (la fecha ya quedó una frecuencia después). */
  skippedNext?: boolean;
  imageUrl?: string | null;
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

export function mapSubscription(s: ApiSubscription): CustomerSubscription {
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
  // Así representa la API "esperando el pago del primer pedido" (estado
  // PAYMENT_FAILED sin envíos; ver subscription-first-order.ts en el backend).
  const awaitingFirstPayment =
    s.status === "PAYMENT_FAILED" && (s.lastShippedAt ?? null) === null;
  const product = s.product ?? s.variant?.product ?? null;
  // Precio de cada envío: el de suscripción de la variante menos el descuento
  // propio de la suscripción (el envío se suma aparte, según la tienda).
  const basePrice =
    s.unitPriceCents ??
    s.variant?.priceSubscription ??
    s.variant?.priceOneTime ??
    Math.round(s.unitPrice ?? 0);
  const unitPriceCents = s.discountPct
    ? Math.max(0, basePrice - Math.round((basePrice * s.discountPct) / 100))
    : basePrice;
  const noNextDate = status === "PAUSED" || status === "CANCELLED" || awaitingFirstPayment;

  return {
    id: s.id,
    productSlug: s.productSlug ?? product?.slug ?? "",
    productName: s.productName ?? product?.name ?? "Café",
    variantLabel,
    unitPriceCents,
    frequencyDays: s.frequencyDays ?? 30,
    status,
    nextShipAt: noNextDate ? "—" : formatShortDate(nextShipAt),
    daysUntilNext: noNextDate ? -1 : daysUntil(nextShipAt),
    awaitingFirstPayment,
    skippedNext: s.status === "SKIPPED_NEXT",
    imageUrl: s.variant?.product?.images?.[0]?.url ?? null,
  };
}

export async function getCustomerSubscriptions(): Promise<CustomerSubscription[]> {
  if (env.useMocks) return MOCK_SUBSCRIPTIONS;
  const { token, isMockSession } = await getCustomerSession();
  if (!token) return [];
  if (isMockSession) return MOCK_SUBSCRIPTIONS;
  const res = await customerFetch<unknown>("/v1/subscriptions?limit=50");
  if (!res.ok) return [];
  return items<ApiSubscription>(res.data).map(mapSubscription);
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
  const { token, isMockSession } = await getCustomerSession();
  if (!token) return [];
  if (isMockSession) return MOCK_ADDRESSES;
  const res = await customerFetch<unknown>("/v1/customers/me/addresses");
  if (!res.ok) return [];
  return items<ApiAddress>(res.data).map(mapAddress);
}
