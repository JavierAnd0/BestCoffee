import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Coffee, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { requireFeature } from "@/lib/data/feature-guard";
import { getCheckoutConfirmation } from "@/lib/data/checkout-confirmation";
import { formatCop, formatOrderCode } from "@/lib/format";

export const metadata: Metadata = { title: "Confirmación de pedido" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; suscripciones?: string }>;
}) {
  await requireFeature("checkout");
  const { orderId: rawOrderId, suscripciones } = await searchParams;
  const orderId = rawOrderId?.trim();
  // Sin número de pedido real no hay nada que confirmar.
  if (!orderId) redirect("/");

  const subscriptionIds = (suscripciones ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const { order, subscriptions } = await getCheckoutConfirmation(orderId, subscriptionIds);
  const paid = order?.paymentStatus === "PAID";
  const hasSubs = subscriptions.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <span className="mx-auto size-16 rounded-full bg-foreground text-background grid place-items-center">
        <Check className="size-8" strokeWidth={2} />
      </span>
      <Eyebrow className="mt-6">Pedido #{formatOrderCode(orderId)}</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
        {paid ? "¡Gracias por tu compra!" : "¡Recibimos tu pedido!"}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {paid
          ? "Tu pago está confirmado. Te enviaremos la confirmación por correo."
          : "Tu pedido quedó registrado y pendiente de pago. La tienda te contactará para coordinar el pago y la entrega; al confirmarse el pago te llega la confirmación por correo."}
      </p>

      {(order || hasSubs) && (
        <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
          {order && (
            <Card
              icon={<Receipt className="size-5" />}
              title={paid ? "Pago confirmado" : "Pendiente de pago"}
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
