"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Truck, MapPin, CreditCard, User, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { formatCop } from "@/lib/format";
import { updateOrderStatusAction } from "@/lib/actions/admin-mutations";
import type { AdminOrderDetailData } from "@/lib/data/admin";

const STATUSES = ["RECEIVED", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
};

export function AdminOrderDetailClient({ order }: { order: AdminOrderDetailData }) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentIdx = STATUSES.indexOf(
    status === "CANCELLED" ? "RECEIVED" : status,
  );

  const handleUpdate = (patch: {
    status?: AdminOrderDetailData["status"];
    trackingNumber?: string;
    internalNotes?: string;
  }) => {
    setFeedback(null);
    if (patch.status) setStatus(patch.status);
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, patch);
      if (res.ok) {
        setFeedback(res.message);
      } else {
        setFeedback(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pedidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a pedidos
      </Link>
      <PageHeader
        title={`Pedido #${order.id}`}
        description={`${order.createdAt} · ${order.fromSubscription ? "Suscripción" : "Compra directa"}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              Imprimir guía
            </Button>
            {status !== "SHIPPED" && status !== "DELIVERED" && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleUpdate({ status: "SHIPPED", trackingNumber })
                }
              >
                {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
                Marcar como enviado
              </Button>
            )}
            {status === "SHIPPED" && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleUpdate({ status: "DELIVERED" })}
              >
                Marcar como entregado
              </Button>
            )}
          </div>
        }
      />

      {feedback && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="size-4" />
          <span>{feedback}</span>
        </div>
      )}

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Estado del pedido</h2>
        <div className="flex items-center justify-between gap-2">
          {STATUSES.map((s, i) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleUpdate({ status: s })}
              className="flex-1 flex flex-col items-center cursor-pointer group"
            >
              <div
                className={
                  "size-8 rounded-full grid place-items-center text-xs font-semibold transition-colors " +
                  (i <= currentIdx
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground group-hover:bg-muted/80")
                }
              >
                {i + 1}
              </div>
              <span className="mt-2 text-xs text-center">{STATUS_LABEL[s]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-lg border border-border bg-background">
          <header className="p-5 border-b border-border">
            <h2 className="font-display text-lg font-semibold">Productos</h2>
          </header>
          <div className="divide-y divide-border">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <span className="size-14 rounded-md bg-muted" aria-hidden />
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  {it.variant && (
                    <div className="text-xs text-muted-foreground">{it.variant}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Cantidad: {it.qty}
                  </div>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatCop(it.totalCents)}
                </span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-border space-y-2 text-sm">
            <Row label="Subtotal" value={formatCop(order.subtotalCents)} />
            <Row
              label="Envío"
              value={order.shippingCents === 0 ? "Gratis" : formatCop(order.shippingCents)}
            />
            {order.discountCents > 0 && (
              <Row label="Descuento" value={`–${formatCop(order.discountCents)}`} />
            )}
            <Row label="Total" value={formatCop(order.totalCents)} bold />
          </div>
        </section>

        <aside className="space-y-4">
          <Card icon={<User className="size-4" />} title="Cliente">
            <div className="text-sm font-medium">{order.customerName}</div>
            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
            <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              render={<Link href="/admin/clientes">Ver clientes</Link>}
            />
          </Card>
          <Card icon={<MapPin className="size-4" />} title="Envío">
            <div className="text-sm">{order.shippingLine}</div>
            <div className="text-sm text-muted-foreground">{order.shippingCity}</div>
            <div className="mt-3 flex gap-2">
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Número de guía"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleUpdate({ trackingNumber })}
              >
                Guardar
              </Button>
            </div>
          </Card>
          <Card icon={<CreditCard className="size-4" />} title="Pago">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            >
              Confirmado
            </Badge>
            <div className="mt-2 text-xs text-muted-foreground">
              Orden procesada en tienda
            </div>
          </Card>
          <Card icon={<Truck className="size-4" />} title="Notas internas">
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas privadas del pedido…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-y"
            />
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleUpdate({ internalNotes })}
              className="mt-2 w-full justify-center"
            >
              Guardar nota
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={"tabular-nums " + (bold ? "font-display text-lg font-semibold" : "")}>
        {value}
      </span>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

