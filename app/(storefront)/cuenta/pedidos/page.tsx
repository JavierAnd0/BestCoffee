import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { getCustomerOrders } from "@/lib/data/account";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos" };

const STATUS_TONE: Record<OrderStatus, string> = {
  PROCESSING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export default async function OrdersPage() {
  const orders = await getCustomerOrders();
  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Historial</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis pedidos
        </h1>
      </header>

      <div className="space-y-3">
        {orders.map((o) => (
          <article
            key={o.id}
            className="rounded-lg border border-border bg-background p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-4 lg:items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">#{o.id}</span>
                {o.fromSubscription && <Badge variant="outline">Suscripción</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {o.createdAt} · {o.itemsCount} artículos
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(3, o.itemsCount) }).map((_, i) => (
                <span key={i} className="size-10 rounded-md bg-muted" aria-hidden />
              ))}
            </div>
            <Badge
              variant="outline"
              className={"justify-self-start lg:justify-self-auto " + STATUS_TONE[o.status]}
            >
              {ORDER_STATUS_LABEL[o.status]}
            </Badge>
            <span className="font-semibold tabular-nums">
              {formatCop(o.totalCents)}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Ver
              </Button>
              <Button variant="outline" size="sm">
                Reordenar
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
