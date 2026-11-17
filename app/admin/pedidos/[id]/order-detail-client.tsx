"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Truck, MapPin, CreditCard, User, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { formatCop } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { markOrderPaidAction, updateOrderStatusAction } from "@/lib/actions/admin-mutations";
import type {
  AdminOrderDetailData,
  AdminPaymentStatus,
  AdminShippingAddress,
} from "@/lib/data/admin";
import { ColombiaLocationSelector } from "@/components/storefront/colombia-location-selector";

const STATUSES = ["RECEIVED", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
};

/** Siguiente paso permitido por la API (`ALLOWED_TRANSITIONS` de admin-orders). */
const NEXT_STATUS: Partial<Record<AdminOrderDetailData["status"], AdminOrderDetailData["status"]>> = {
  RECEIVED: "PREPARING",
  PREPARING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const NEXT_LABEL: Partial<Record<AdminOrderDetailData["status"], string>> = {
  RECEIVED: "Pasar a preparación",
  PREPARING: "Marcar como enviado",
  SHIPPED: "Marcar como entregado",
};

const PAYMENT_LABEL: Record<AdminPaymentStatus, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente de pago",
  FAILED: "Pago fallido",
  REFUNDED: "Reembolsado",
};

const PAYMENT_TONE: Record<AdminPaymentStatus, string> = {
  PAID: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  REFUNDED: "bg-muted text-muted-foreground border-border",
};

export function AdminOrderDetailClient({ order }: { order: AdminOrderDetailData }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [paidError, setPaidError] = useState<string | null>(null);
  // Solo se confirma un pago pendiente o fallido de un pedido vivo (la API
  // rechaza cancelados y reembolsados).
  const canMarkPaid =
    status !== "CANCELLED" && (paymentStatus === "PENDING" || paymentStatus === "FAILED");
  const nextStatus = NEXT_STATUS[status];
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [address, setAddress] = useState<AdminShippingAddress>(order.shippingAddress);
  const [draft, setDraft] = useState<AdminShippingAddress | null>(null);
  // La dirección solo se corrige antes de despachar (el backend lo vuelve a exigir).
  const canEditAddress = status === "RECEIVED" || status === "PREPARING";

  const currentIdx = STATUSES.indexOf(
    status === "CANCELLED" ? "RECEIVED" : status,
  );

  const handleUpdate = (
    patch: {
      status?: AdminOrderDetailData["status"];
      trackingNumber?: string;
      internalNotes?: string;
      shippingAddress?: AdminShippingAddress;
    },
    onSuccess?: () => void,
  ) => {
    setFeedback(null);
    const prevStatus = status;
    if (patch.status) setStatus(patch.status);
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, patch);
      if (res.ok) {
        setFeedback({ ok: true, text: res.message ?? "Pedido actualizado." });
        onSuccess?.();
      } else {
        // El cambio no se guardó: la pantalla vuelve a lo que hay en el sistema.
        if (patch.status) setStatus(prevStatus);
        setFeedback({ ok: false, text: res.error });
      }
    });
  };

  const handleMarkPaid = () => {
    setPaidError(null);
    startTransition(async () => {
      const res = await markOrderPaidAction(order.id);
      if (res.ok) {
        setPaymentStatus("PAID");
        setConfirmPaid(false);
        setFeedback({ ok: true, text: res.message });
      } else {
        setPaidError(res.error);
      }
    });
  };

  const field = (key: keyof AdminShippingAddress, label: string, placeholder = "") => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={draft?.[key] ?? ""}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
      />
    </label>
  );

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
            {status !== "DELIVERED" && status !== "CANCELLED" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="text-destructive"
                onClick={() => {
                  const msg =
                    paymentStatus === "PAID"
                      ? "¿Cancelar este pedido? Se devolverá el stock descontado. No se puede deshacer."
                      : "¿Cancelar este pedido? No se puede deshacer.";
                  if (window.confirm(msg)) handleUpdate({ status: "CANCELLED" });
                }}
              >
                Cancelar pedido
              </Button>
            )}
            {nextStatus && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleUpdate(
                    nextStatus === "SHIPPED"
                      ? { status: nextStatus, trackingNumber }
                      : { status: nextStatus },
                  )
                }
              >
                {isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
                {NEXT_LABEL[status]}
              </Button>
            )}
          </div>
        }
      />

      {feedback && (
        <div
          role={feedback.ok ? "status" : "alert"}
          className={
            "rounded-md border px-4 py-2.5 text-sm flex items-center gap-2 " +
            (feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-destructive/30 bg-destructive/10 text-destructive")
          }
        >
          {feedback.ok && <Check className="size-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Estado del pedido</h2>
        {status === "CANCELLED" && (
          <p className="mb-4 text-sm text-destructive">Este pedido está cancelado.</p>
        )}
        <div className="flex items-center justify-between gap-2">
          {STATUSES.map((s, i) => (
            <button
              key={s}
              type="button"
              // Solo el siguiente paso es válido; los demás los rechaza la API.
              disabled={isPending || s !== nextStatus}
              onClick={() =>
                handleUpdate(s === "SHIPPED" ? { status: s, trackingNumber } : { status: s })
              }
              className="flex-1 flex flex-col items-center cursor-pointer disabled:cursor-default group"
            >
              <div
                className={
                  "size-8 rounded-full grid place-items-center text-xs font-semibold transition-colors " +
                  (status !== "CANCELLED" && i <= currentIdx
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
            {draft ? (
              <div className="space-y-2">
                {field("recipientName", "Quién recibe", "Nombre y apellido")}
                {field("line1", "Dirección", "Calle 123 # 45-67")}
                {field("line2", "Complemento", "Apto, torre, oficina")}
                <ColombiaLocationSelector
                  variant="dialog"
                  department={draft.state}
                  city={draft.city}
                  onDepartmentChange={(state) => setDraft((d) => (d ? { ...d, state } : d))}
                  onCityChange={(city) => setDraft((d) => (d ? { ...d, city } : d))}
                  departmentId="admin-order-department"
                  cityId="admin-order-city"
                />
                {field("phone", "Teléfono de contacto", "+57 300 123 4567")}
                {field("postalCode", "Código postal (opcional)")}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={isPending}
                    className="flex-1 justify-center"
                    onClick={() =>
                      handleUpdate({ shippingAddress: draft }, () => {
                        setAddress(draft);
                        setDraft(null);
                      })
                    }
                  >
                    Guardar dirección
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setDraft(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {address.recipientName && (
                  <div className="text-sm font-medium">{address.recipientName}</div>
                )}
                <div className="text-sm">{address.line1 || order.shippingLine}</div>
                {address.line2 && <div className="text-sm">{address.line2}</div>}
                <div className="text-sm text-muted-foreground">
                  {[address.city, address.state].filter(Boolean).join(", ") || order.shippingCity}
                </div>
                {address.phone && (
                  <div className="text-xs text-muted-foreground">{address.phone}</div>
                )}
                {canEditAddress ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full justify-center"
                    onClick={() => setDraft(address)}
                  >
                    Corregir dirección
                  </Button>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    La dirección ya no se puede cambiar: el pedido salió o se cerró.
                  </p>
                )}
              </>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Guía o enlace de seguimiento"
                aria-label="Número de guía o enlace de seguimiento"
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
            <Badge variant="outline" className={PAYMENT_TONE[paymentStatus]}>
              {PAYMENT_LABEL[paymentStatus]}
            </Badge>
            {canMarkPaid && (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  ¿El cliente ya pagó por transferencia o contra entrega? Confírmalo aquí.
                </p>
                <Button
                  size="sm"
                  disabled={isPending}
                  className="mt-3 w-full justify-center"
                  onClick={() => {
                    setPaidError(null);
                    setConfirmPaid(true);
                  }}
                >
                  Marcar como pagado
                </Button>
              </>
            )}
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

      <Dialog open={confirmPaid} onOpenChange={(o) => !isPending && setConfirmPaid(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              ¿Confirmar el pago de {formatCop(order.totalCents)}?
            </DialogTitle>
            <DialogDescription>
              Hazlo solo si ya recibiste el dinero. Se descontará el inventario, se contará el
              cupón (si lo hay) y el cliente recibirá la confirmación por correo.
            </DialogDescription>
          </DialogHeader>
          {paidError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {paidError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmPaid(false)}
            >
              Volver
            </Button>
            <Button disabled={isPending} onClick={handleMarkPaid}>
              {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Sí, marcar como pagado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

