import { ORDER_STATUS_LABEL, type MockOrder } from "./mocks/account";

/**
 * Cómo se muestra un pedido en la cuenta del cliente. Combina el estado del
 * envío con el del pago: un pedido sin pagar no se presenta como "Procesando"
 * con el pago confirmado.
 */

const TONE = {
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  sky: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  red: "bg-destructive/10 text-destructive border-destructive/20",
  muted: "bg-muted text-muted-foreground border-border",
} as const;

type DisplayOrder = Pick<MockOrder, "status" | "paymentStatus" | "preparing">;

/** Los datos de ejemplo no traen el pago: se toman como pagados. */
function payment(o: DisplayOrder) {
  return o.paymentStatus ?? "PAID";
}

export function orderBadge(o: DisplayOrder): { label: string; tone: string } {
  if (o.status === "CANCELLED") return { label: ORDER_STATUS_LABEL.CANCELLED, tone: TONE.muted };
  const pay = payment(o);
  if (pay === "REFUNDED") return { label: "Reembolsado", tone: TONE.muted };
  if (pay === "FAILED") return { label: "Pago no completado", tone: TONE.red };
  if (pay === "PENDING") return { label: "Pago pendiente", tone: TONE.amber };
  if (o.status === "SHIPPED") return { label: ORDER_STATUS_LABEL.SHIPPED, tone: TONE.sky };
  if (o.status === "DELIVERED") return { label: ORDER_STATUS_LABEL.DELIVERED, tone: TONE.emerald };
  return { label: o.preparing ? "En preparación" : "Pago confirmado", tone: TONE.amber };
}

export type TimelineStep = { label: string; state: "done" | "todo" | "error" };

export function orderTimeline(o: DisplayOrder): TimelineStep[] {
  const pay = payment(o);
  if (o.status === "CANCELLED") {
    return [
      { label: "Pedido recibido", state: "done" },
      { label: "Cancelado", state: "error" },
    ];
  }
  if (pay === "FAILED") {
    return [
      { label: "Pedido recibido", state: "done" },
      { label: "Pago no completado", state: "error" },
    ];
  }
  const shipped = o.status === "SHIPPED" || o.status === "DELIVERED";
  return [
    { label: "Pedido recibido", state: "done" },
    {
      label: pay === "PENDING" ? "Pago pendiente" : pay === "REFUNDED" ? "Reembolsado" : "Pago confirmado",
      state: pay === "PENDING" ? "todo" : "done",
    },
    { label: "En preparación", state: shipped || o.preparing ? "done" : "todo" },
    { label: "Enviado", state: shipped ? "done" : "todo" },
    { label: "Entregado", state: o.status === "DELIVERED" ? "done" : "todo" },
  ];
}
