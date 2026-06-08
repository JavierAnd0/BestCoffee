import Link from "next/link";
import type { Metadata } from "next";
import { Check, Truck, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = { title: "Confirmación de pedido" };

export default function ConfirmationPage() {
  // Mock order id; in production this comes from the URL or query param after
  // a successful Stripe redirect.
  const orderId = "ORG-10428";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <span className="mx-auto size-16 rounded-full bg-foreground text-background grid place-items-center">
        <Check className="size-8" strokeWidth={2} />
      </span>
      <Eyebrow className="mt-6">Pedido #{orderId}</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
        ¡Gracias por tu compra!
      </h1>
      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Te enviamos la confirmación a tu correo electrónico. Tu café se tuesta bajo
        pedido y sale lo más fresco posible.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
        <Card icon={<Truck className="size-5" />} title="Entrega estimada" body="12–14 jun · Bogotá" />
        <Card icon={<Coffee className="size-5" />} title="Suscripción activa" body="Próximo envío ~24 jun · cada 2 sem" />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/cuenta/pedidos">Ver mi pedido</Link>} />
        <Button
          variant="outline"
          render={<Link href="/cuenta/suscripciones">Gestionar suscripción</Link>}
        />
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
      <span className="size-10 rounded-md bg-muted grid place-items-center">{icon}</span>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}
