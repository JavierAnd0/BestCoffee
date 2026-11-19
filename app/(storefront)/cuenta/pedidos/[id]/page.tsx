import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Download, RefreshCw, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCustomerOrder } from "@/lib/data/account";
import { orderBadge, orderTimeline } from "@/lib/order-display";
import { formatCop, formatOrderCode } from "@/lib/format";
import { ItemThumb } from "@/components/storefront/item-thumb";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pedido #${id}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getCustomerOrder(id);
  if (!order) notFound();

  const items = order.items?.length
    ? order.items
    : [{ name: "Café de especialidad", variant: "250 g · Grano entero", qty: order.itemsCount, priceCents: order.totalCents }];

  const subtotal = order.subtotalCents ?? items.reduce((s, it) => s + it.priceCents * it.qty, 0);
  const total = order.totalCents;
  const shipping = order.shippingCents ?? Math.max(0, total - subtotal);
  const discount = order.discountCents ?? 0;
  const timeline = orderTimeline(order);
  const badge = orderBadge(order);

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/cuenta/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="size-4" />
          Mis pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>Pedido</Eyebrow>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            #{formatOrderCode(order.id)}
          </h1>
          <Badge variant="outline" className={badge.tone}>
            {badge.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {order.createdAt}
          {order.fromSubscription && " · Pedido de suscripción"}
          {order.id.length > 12 && (
            <span className="ml-2 font-mono text-[11px] text-muted-foreground/70">
              (ID: {order.id})
            </span>
          )}
        </p>
      </header>

      {/* Status timeline */}
      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
          Estado del envío
        </h2>
        <ol className="flex items-start gap-0">
          {timeline.map((step, i) => (
            <li key={i} className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div className={
                  "size-6 rounded-full border-2 shrink-0 grid place-items-center " +
                  (step.state === "done"
                    ? "bg-foreground border-foreground"
                    : step.state === "error"
                      ? "bg-destructive border-destructive"
                      : "border-border bg-background")
                }>
                  {step.state === "done" && (
                    <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 6l3 3 7-6" />
                    </svg>
                  )}
                  {step.state === "error" && (
                    <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  )}
                </div>
                {i < timeline.length - 1 && (
                  <div className={"flex-1 h-0.5 " + (timeline[i + 1]?.state !== "todo" ? "bg-foreground" : "bg-border")} />
                )}
              </div>
              <span className={
                "mt-2 text-[11px] leading-tight " +
                (step.state === "error"
                  ? "font-medium text-destructive"
                  : step.state === "done"
                    ? "font-medium"
                    : "text-muted-foreground")
              }>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
        {order.paymentStatus === "PENDING" && order.status !== "CANCELLED" && (
          <p className="mt-4 text-xs text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
            Estamos esperando la confirmación de tu pago. Si pagaste por PSE o en efectivo puede
            tardar un poco; la preparación empieza cuando se confirme.
          </p>
        )}
        {order.paymentStatus === "FAILED" && order.status !== "CANCELLED" && (
          <p className="mt-4 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            El pago de este pedido no se completó y no se hizo ningún cobro. Si aún quieres
            los productos, haz un pedido nuevo.
          </p>
        )}
        {(order.status === "SHIPPED" || order.status === "DELIVERED") && order.trackingUrl ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-sky-500/10 border border-sky-500/20 rounded-md px-3 py-2 hover:bg-sky-500/15"
          >
            Ver seguimiento del envío
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          order.status === "SHIPPED" && (
            <p className="mt-4 text-xs text-sky-700 bg-sky-500/10 border border-sky-500/20 rounded-md px-3 py-2">
              Tu pedido va en camino.
            </p>
          )
        )}
      </section>

      {/* Items */}
      <section className="rounded-lg border border-border bg-background">
        <div className="p-5 border-b border-border">
          <h2 className="font-medium text-sm">Artículos ({items.length})</h2>
        </div>
        <ul className="divide-y divide-border">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 p-5">
              <ItemThumb
                src={item.imageUrl}
                alt={item.imageAlt ?? item.name}
                className="size-14"
                sizes="56px"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {item.productSlug ? (
                    <Link
                      href={`/p/${item.productSlug}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{item.variant}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold tabular-nums">{formatCop(item.priceCents)}</div>
                <div className="text-xs text-muted-foreground">×{item.qty}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Shipping address */}
        <section className="rounded-lg border border-border bg-background p-5">
          <h2 className="font-medium text-sm mb-3">Dirección de envío</h2>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 mt-0.5 text-accent" />
            <span>{order.shippingAddress || "Sin dirección registrada"}</span>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-lg border border-border bg-background p-5">
          <h2 className="font-medium text-sm mb-3">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal productos</dt>
              <dd className="tabular-nums">{formatCop(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Envío</dt>
              <dd>{shipping === 0 ? "Gratis ($0)" : formatCop(shipping)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Descuento aplicado</dt>
                <dd className="tabular-nums">-{formatCop(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t border-border text-foreground">
              <dt>Total pagado</dt>
              <dd className="tabular-nums text-base">{formatCop(total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          render={
            <Link href={`/cuenta/pedidos/${order.id}/factura`} className="inline-flex items-center gap-2">
              <Download className="size-4" />
              Ver / Descargar factura
            </Link>
          }
        />
        {order.status === "DELIVERED" && (
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="size-4" />
            Volver a pedir
          </Button>
        )}
      </div>
    </div>
  );
}
