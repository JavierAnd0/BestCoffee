import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Download, RefreshCw, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCustomerOrders } from "@/lib/data/account";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { formatCop } from "@/lib/format";

const STATUS_TONE: Record<OrderStatus, string> = {
  PROCESSING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

// Mock line items — API wires real items in phase 3
const MOCK_ITEMS: Record<string, { name: string; variant: string; qty: number; priceCents: number }[]> = {
  "ORG-10428": [
    { name: "Mezcla del alba", variant: "340 g · Grano entero", qty: 2, priceCents: 58_000_00 },
    { name: "Etiopía Guji", variant: "340 g · Grano entero", qty: 1, priceCents: 72_000_00 },
  ],
  "ORG-10390": [
    { name: "Hairbender", variant: "340 g · Espresso", qty: 1, priceCents: 62_000_00 },
  ],
  "ORG-10312": [
    { name: "Holler Mountain", variant: "340 g · Grano entero", qty: 1, priceCents: 52_000_00 },
    { name: "Mezcla del alba", variant: "340 g · Molido filtro", qty: 1, priceCents: 58_000_00 },
  ],
  "ORG-10288": [
    { name: "Etiopía Guji", variant: "340 g · Grano entero", qty: 1, priceCents: 72_000_00 },
  ],
};

const TIMELINE: Record<OrderStatus, { label: string; done: boolean }[]> = {
  PROCESSING: [
    { label: "Pedido recibido", done: true },
    { label: "Pago confirmado", done: true },
    { label: "En preparación", done: true },
    { label: "Enviado", done: false },
    { label: "Entregado", done: false },
  ],
  SHIPPED: [
    { label: "Pedido recibido", done: true },
    { label: "Pago confirmado", done: true },
    { label: "En preparación", done: true },
    { label: "Enviado", done: true },
    { label: "Entregado", done: false },
  ],
  DELIVERED: [
    { label: "Pedido recibido", done: true },
    { label: "Pago confirmado", done: true },
    { label: "En preparación", done: true },
    { label: "Enviado", done: true },
    { label: "Entregado", done: true },
  ],
  CANCELLED: [
    { label: "Pedido recibido", done: true },
    { label: "Cancelado", done: true },
  ],
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pedido #${id}` };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const orders = await getCustomerOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();

  const items = MOCK_ITEMS[id] ?? [
    { name: "Café ORÍGEN", variant: "340 g · Grano entero", qty: order.itemsCount, priceCents: order.totalCents },
  ];
  const subtotal = items.reduce((s, it) => s + it.priceCents * it.qty, 0);
  const shipping = order.fromSubscription ? 0 : 8_000_00;
  const timeline = TIMELINE[order.status];

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
            #{order.id}
          </h1>
          <Badge variant="outline" className={STATUS_TONE[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {order.createdAt}
          {order.fromSubscription && " · Pedido de suscripción"}
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
                  (step.done
                    ? "bg-foreground border-foreground"
                    : "border-border bg-background")
                }>
                  {step.done && (
                    <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 6l3 3 7-6" />
                    </svg>
                  )}
                </div>
                {i < timeline.length - 1 && (
                  <div className={"flex-1 h-0.5 " + (timeline[i + 1]?.done ? "bg-foreground" : "bg-border")} />
                )}
              </div>
              <span className={"mt-2 text-[11px] leading-tight " + (step.done ? "font-medium" : "text-muted-foreground")}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
        {order.status === "SHIPPED" && (
          <p className="mt-4 text-xs text-sky-700 bg-sky-500/10 border border-sky-500/20 rounded-md px-3 py-2">
            En camino · Entrega estimada: 1–2 días hábiles
          </p>
        )}
      </section>

      {/* Items */}
      <section className="rounded-lg border border-border bg-background">
        <div className="p-5 border-b border-border">
          <h2 className="font-medium text-sm">
            Artículos ({items.length})
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 p-5">
              <span className="size-14 rounded-md bg-muted shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.name}</div>
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
            <span>Cra 12 #34-56, Bogotá · Colombia</span>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-lg border border-border bg-background p-5">
          <h2 className="font-medium text-sm mb-3">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCop(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Envío</dt>
              <dd>{shipping === 0 ? "Gratis" : formatCop(shipping)}</dd>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-border">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCop(subtotal + shipping)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Descargar factura
        </Button>
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
