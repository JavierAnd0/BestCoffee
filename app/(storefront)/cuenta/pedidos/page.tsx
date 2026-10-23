import type { Metadata } from "next";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { getCustomerOrders } from "@/lib/data/account";
import { formatCop, formatOrderCode } from "@/lib/format";

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

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center max-w-lg mx-auto">
          <Coffee className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-semibold">Aún no tienes pedidos registrados</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Explora nuestros cafés de especialidad o equipamiento de barismo para hacer tu primera compra.
          </p>
          <Button render={<Link href="/catalogo">Explorar catálogo</Link>} />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <article
              key={o.id}
              className="rounded-lg border border-border bg-background p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground font-mono">
                    #{formatOrderCode(o.id)}
                  </span>
                  {o.fromSubscription && <Badge variant="outline">Suscripción</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {o.createdAt} · {o.itemsCount} {o.itemsCount === 1 ? "artículo" : "artículos"}
                </div>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(3, o.itemsCount) }).map((_, i) => (
                  <span
                    key={i}
                    className="size-10 rounded-md bg-muted/70 border border-border/40 grid place-items-center text-muted-foreground"
                    aria-hidden
                  >
                    <Coffee className="size-4 opacity-70" />
                  </span>
                ))}
              </div>
              <Badge
                variant="outline"
                className={"justify-self-start lg:justify-self-auto " + STATUS_TONE[o.status]}
              >
                {ORDER_STATUS_LABEL[o.status]}
              </Badge>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCop(o.totalCents)}
              </span>
              <div className="flex flex-wrap items-center gap-2 justify-self-start sm:justify-self-end lg:justify-self-auto">
                <Button variant="outline" size="sm" render={<Link href={`/cuenta/pedidos/${o.id}`}>Ver detalles</Link>} />
                <Button variant="ghost" size="sm" render={<Link href={`/cuenta/pedidos/${o.id}/factura`}>Factura</Link>} />
                <Button variant="outline" size="sm" render={<Link href="/catalogo">Reordenar</Link>} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
