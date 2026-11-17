import { env } from "../env";
import { customerFetch } from "../api/gateway";
import { getCustomerSession } from "../auth/session-store";
import { getCustomerSubscriptions, type CustomerSubscription } from "./account";

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
