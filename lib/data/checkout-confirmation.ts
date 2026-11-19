import { env } from "../env";
import { customerFetch } from "../api/gateway";
import { getCustomerSession } from "../auth/session-store";
import { getCustomerSubscriptions, type CustomerSubscription } from "./account";
import { resolveActiveTenantSlug } from "../tenant";
import { clientIpHeaders } from "../api/client-ip";

/**
 * Datos reales para la página de confirmación del checkout. Solo con sesión de
 * cliente: un invitado ve la confirmación genérica (no hay forma de verificar
 * que el pedido sea suyo).
 */
export interface CheckoutConfirmation {
  order: {
    totalCents: number;
    paymentStatus: string;
    city: string | null;
  } | null;
  subscriptions: CustomerSubscription[];
}

interface ApiOrderDetail {
  totalCents?: number;
  paymentStatus?: string;
  shippingAddress?: { city?: string } | null;
}

export async function getCheckoutConfirmation(
  orderId: string,
  subscriptionIds: string[],
): Promise<CheckoutConfirmation> {
  const empty: CheckoutConfirmation = { order: null, subscriptions: [] };
  if (env.useMocks) return empty;
  const { token, isMockSession } = await getCustomerSession();
  if (!token || isMockSession) return empty;

  const [orderRes, subs] = await Promise.all([
    customerFetch<ApiOrderDetail>(`/v1/orders/${encodeURIComponent(orderId)}`),
    subscriptionIds.length ? getCustomerSubscriptions() : Promise.resolve([]),
  ]);

  const wanted = new Set(subscriptionIds);
  return {
    order:
      orderRes.ok && orderRes.data
        ? {
            totalCents: orderRes.data.totalCents ?? 0,
            paymentStatus: orderRes.data.paymentStatus ?? "PENDING",
            city: orderRes.data.shippingAddress?.city ?? null,
          }
        : null,
    // Solo las suscripciones de este pedido, y solo si son del cliente (las
    // devuelve su propio listado).
    subscriptions: subs.filter((s) => wanted.has(s.id)),
  };
}

export interface MercadoPagoReturn {
  /** Estado del pedido tras aplicar el pago (PAID, PENDING…), o null. */
  paymentStatus: string | null;
  /** Estado del pago en MercadoPago (approved, pending, rejected…), o null. */
  mpStatus: string | null;
}

/**
 * Regreso de Checkout Pro: pide al backend que consulte el pago en
 * MercadoPago y lo aplique al pedido, sin esperar el webhook. Funciona también
 * para invitados (el backend solo aplica pagos de esa tienda y ese pedido).
 */
export async function syncMercadoPagoReturn(
  orderId: string,
  paymentId: string,
): Promise<MercadoPagoReturn> {
  const none: MercadoPagoReturn = { paymentStatus: null, mpStatus: null };
  if (env.useMocks || !/^\d{1,20}$/.test(paymentId)) return none;
  try {
    const tenantSlug = await resolveActiveTenantSlug();
    const res = await fetch(`${env.apiUrlInternal}/v1/mercadopago/sync`, {
      method: "POST",
      headers: {
        ...(await clientIpHeaders()),
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        "x-internal-secret": env.revalidateSecret,
      },
      body: JSON.stringify({ orderId, paymentId }),
      cache: "no-store",
    });
    if (!res.ok) return none;
    const data = (await res.json()) as Partial<MercadoPagoReturn>;
    return {
      paymentStatus: data.paymentStatus ?? null,
      mpStatus: data.mpStatus ?? null,
    };
  } catch {
    return none;
  }
}

export interface EpaycoReturn {
  /** Estado del pedido tras aplicar la transacción (PAID, PENDING, FAILED…), o null. */
  paymentStatus: string | null;
  /** Estado en ePayco (Aceptada, Pendiente, Rechazada…), o null si no se aplicó. */
  epaycoStatus: string | null;
}

/**
 * Regreso de ePayco: el backend consulta la transacción por `ref_payco`, la
 * valida (tienda, pedido, firma y monto) y la aplica sin esperar el aviso.
 */
export async function syncEpaycoReturn(
  orderId: string,
  refPayco: string,
): Promise<EpaycoReturn> {
  const none: EpaycoReturn = { paymentStatus: null, epaycoStatus: null };
  if (env.useMocks || !/^[A-Za-z0-9]{1,64}$/.test(refPayco)) return none;
  try {
    const tenantSlug = await resolveActiveTenantSlug();
    const res = await fetch(`${env.apiUrlInternal}/v1/epayco/sync`, {
      method: "POST",
      headers: {
        ...(await clientIpHeaders()),
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        "x-internal-secret": env.revalidateSecret,
      },
      body: JSON.stringify({ orderId, refPayco }),
      cache: "no-store",
    });
    if (!res.ok) return none;
    const data = (await res.json()) as Partial<EpaycoReturn>;
    return {
      paymentStatus: data.paymentStatus ?? null,
      epaycoStatus: data.epaycoStatus ?? null,
    };
  } catch {
    return none;
  }
}
