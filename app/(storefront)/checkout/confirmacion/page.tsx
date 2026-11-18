import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Clock, Coffee, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireFeature } from "@/lib/data/feature-guard";
import {
  getCheckoutConfirmation,
  syncMercadoPagoReturn,
} from "@/lib/data/checkout-confirmation";
import { formatCop, formatOrderCode } from "@/lib/format";
import { ClearCartOnMount } from "@/components/storefront/clear-cart-on-mount";

export const metadata: Metadata = { title: "Confirmación de pedido" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    suscripciones?: string;
    /** Lo pone la URL de regreso de MercadoPago: aprobado | pendiente | fallido. */
    pago?: string;
    /** Lo agrega MercadoPago al volver (Checkout Pro). */
    payment_id?: string;
  }>;
}) {
  await requireFeature("checkout");
  const { orderId: rawOrderId, suscripciones, pago, payment_id } = await searchParams;
  const orderId = rawOrderId?.trim();
  // Sin número de pedido real no hay nada que confirmar.
  if (!orderId) redirect("/");

  const subscriptionIds = (suscripciones ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  // De vuelta de MercadoPago: primero se aplica el pago real (sin esperar el
  // webhook) y luego se lee el pedido ya actualizado.
  const mp = payment_id ? await syncMercadoPagoReturn(orderId, payment_id) : null;
  const { order, subscriptions } = await getCheckoutConfirmation(orderId, subscriptionIds);
  // Estado del pago: el del pedido manda; un invitado no puede leerlo, pero sí
  // el que devolvió la consulta a MercadoPago.
  const status = order?.paymentStatus ?? mp?.paymentStatus ?? null;
  const paid = status === "PAID";
  // El comprador salió de MercadoPago sin pagar (o el pedido no pudo cobrarse).
  const failed = !paid && (status === "FAILED" || pago === "fallido");
  // Pagó o está pagando en MercadoPago, pero el pago aún no está aprobado
  // (PSE en curso, efectivo por pagar en Efecty, tarjeta en revisión…).
  const confirming = !paid && !failed && (pago === "aprobado" || pago === "pendiente");
  const hasSubs = subscriptions.length > 0;

  if (failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="mx-auto size-16 rounded-full bg-destructive/10 text-destructive grid place-items-center">
          <X className="size-8" strokeWidth={2} />
        </span>
        <Eyebrow className="mt-6">Pedido #{formatOrderCode(orderId)}</Eyebrow>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          El pago no se completó
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          No se hizo ningún cobro. Tu carrito sigue guardado: vuelve al checkout para
          intentarlo de nuevo o elegir otro medio de pago en MercadoPago.
        </p>
        <div className="mt-10 flex justify-center">
          <Button render={<Link href="/checkout">Volver al checkout</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <ClearCartOnMount />
      <span className="mx-auto size-16 rounded-full bg-foreground text-background grid place-items-center">
        {confirming ? (
          <Clock className="size-8" strokeWidth={2} />
        ) : (
          <Check className="size-8" strokeWidth={2} />
        )}
      </span>
      <Eyebrow className="mt-6">Pedido #{formatOrderCode(orderId)}</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
        {paid
          ? "¡Gracias por tu compra!"
          : confirming
            ? "Estamos confirmando tu pago"
            : "¡Recibimos tu pedido!"}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {paid
          ? "Tu pago está confirmado. Te enviaremos la confirmación por correo."
          : confirming
            ? mp?.mpStatus === "pending"
              ? "Tu pago quedó pendiente en MercadoPago (por ejemplo, un pago en efectivo o PSE en curso). En cuanto se acredite te llegará la confirmación por correo."
              : "MercadoPago nos avisará en cuanto se acredite el pago; suele tardar unos minutos. Te llegará la confirmación por correo."
            : "Tu pedido quedó registrado y pendiente de pago. La tienda te contactará para coordinar el pago y la entrega; al confirmarse el pago te llega la confirmación por correo."}
      </p>

      {(order || hasSubs) && (
        <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
          {order && (
            <Card
              icon={<Receipt className="size-5" />}
              title={
                paid ? "Pago confirmado" : confirming ? "Pago en confirmación" : "Pendiente de pago"
              }
              body={`Total ${formatCop(order.totalCents)}${order.city ? ` · envío a ${order.city}` : ""}`}
            />
          )}
          {subscriptions.map((s) => (
            <Card
              key={s.id}
              icon={<Coffee className="size-5" />}
              title={`Suscripción · ${s.productName}`}
              body={
                s.awaitingFirstPayment
                  ? `1 unidad cada ${s.frequencyDays / 7} sem · se activa al confirmarse el pago de este pedido. Cada envío genera un pedido que se paga igual que este.`
                  : `1 unidad cada ${s.frequencyDays / 7} sem · próximo envío ${s.nextShipAt}`
              }
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {order && <Button render={<Link href="/cuenta/pedidos">Ver mi pedido</Link>} />}
        {hasSubs && (
          <Button
            variant="outline"
            render={<Link href="/cuenta/suscripciones">Gestionar suscripción</Link>}
          />
        )}
      </div>

      <Link
        href="/"
        className="mt-12 inline-block text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
      >
        Seguir comprando
      </Link>
    </div>
  );
}

function Card({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5 flex items-start gap-4">
      <span className="size-10 rounded-md bg-muted grid place-items-center shrink-0">{icon}</span>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}
