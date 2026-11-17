// Lecturas de logística para el panel: solo lo que respalda la API de pedidos
// (/v1/admin/orders). No hay transportadoras, zonas ni tarifas en el backend,
// así que no se muestran.

import { env } from "../env";
import { operatorFetch, type GatewayResult } from "../api/gateway";

type OrderStatus = "RECEIVED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

interface ApiOrderRow {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalCents: number;
  createdAt: string;
  customer?: { email?: string | null; name?: string | null } | null;
  _count?: { items?: number };
}

interface ApiOrderDetail {
  id: string;
  trackingUrl?: string | null;
  updatedAt?: string;
  shippingAddress?: { city?: string; state?: string } | null;
}

export interface LogisticsOrder {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: string;
  items: number;
  totalCents: number;
  createdAt: string;
  city?: string;
  trackingUrl?: string | null;
  updatedAt?: string;
}

export interface LogisticsData {
  /** Pagados y aún sin despachar (RECEIVED / PREPARING), del más antiguo al más nuevo. */
  toDispatch: LogisticsOrder[];
  /** Despachados (SHIPPED), los más recientes primero. */
  shipped: LogisticsOrder[];
  /** Total de pedidos en SHIPPED leídos (la lista muestra hasta 50). */
  shippedTotal: number;
  /** Pedidos recibidos con el pago pendiente (no se despachan hasta marcarlos pagados). */
  awaitingPayment: number;
  /** true si alguna lista llegó al tope de lectura y puede haber más. */
  truncated: boolean;
  error?: string;
}

const PAGE = 100;
const MAX_PAGES = 5;

async function listOrders(
  query: Record<string, string>,
): Promise<{ ok: true; rows: ApiOrderRow[]; truncated: boolean } | { ok: false; error: string }> {
  const rows: ApiOrderRow[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const qs: URLSearchParams = new URLSearchParams({ ...query, limit: String(PAGE), ...(cursor ? { cursor } : {}) });
    const res: GatewayResult<{ items: ApiOrderRow[]; nextCursor: string | null }> = await operatorFetch(
      `/v1/admin/orders?${qs.toString()}`,
    );
    if (!res.ok) return { ok: false, error: res.error };
    rows.push(...(res.data?.items ?? []));
    cursor = res.data?.nextCursor ?? null;
    if (!cursor) return { ok: true, rows, truncated: false };
  }
  return { ok: true, rows, truncated: true };
}

function mapRow(o: ApiOrderRow): LogisticsOrder {
  return {
    id: o.id,
    status: o.status,
    paymentStatus: o.paymentStatus,
    customer: o.customer?.name || o.customer?.email || "—",
    items: o._count?.items ?? 0,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
  };
}

/** Detalle de cada pedido (seguimiento y ciudad), que el listado no trae. */
async function withDetail(orders: LogisticsOrder[]): Promise<LogisticsOrder[]> {
  return Promise.all(
    orders.map(async (o) => {
      const r = await operatorFetch<ApiOrderDetail>(`/v1/admin/orders/${encodeURIComponent(o.id)}`);
      if (!r.ok || !r.data) return o;
      return {
        ...o,
        trackingUrl: r.data.trackingUrl ?? null,
        updatedAt: r.data.updatedAt,
        city: r.data.shippingAddress?.city,
      };
    }),
  );
}

export async function getLogisticsData(): Promise<LogisticsData> {
  const empty: LogisticsData = { toDispatch: [], shipped: [], shippedTotal: 0, awaitingPayment: 0, truncated: false };
  if (env.useMocks) return empty;

  const [received, preparing, shipped, unpaid] = await Promise.all([
    listOrders({ paymentStatus: "PAID", status: "RECEIVED" }),
    listOrders({ paymentStatus: "PAID", status: "PREPARING" }),
    listOrders({ status: "SHIPPED" }),
    listOrders({ paymentStatus: "PENDING", status: "RECEIVED" }),
  ]);
  const failed = [received, preparing, shipped, unpaid].find((r) => !r.ok);
  if (failed && !failed.ok) return { ...empty, error: failed.error };
  if (!received.ok || !preparing.ok || !shipped.ok || !unpaid.ok) return empty;

  const toDispatch = [...received.rows, ...preparing.rows]
    .map(mapRow)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Solo se consulta el detalle de lo que se va a pintar (hasta 50 de cada lista).
  const [dispatchDetailed, shippedDetailed] = await Promise.all([
    withDetail(toDispatch.slice(0, 50)),
    withDetail(shipped.rows.map(mapRow).slice(0, 50)),
  ]);

  return {
    toDispatch: [...dispatchDetailed, ...toDispatch.slice(50)],
    shipped: shippedDetailed,
    shippedTotal: shipped.rows.length,
    awaitingPayment: unpaid.rows.length,
    truncated:
      received.truncated || preparing.truncated || shipped.truncated || unpaid.truncated,
  };
}
