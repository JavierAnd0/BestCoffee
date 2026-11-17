import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { SubscriptionCard } from "@/components/storefront/subscription-card";
import { getCustomerSubscriptions } from "@/lib/data/account";

export const metadata: Metadata = { title: "Mis suscripciones" };

export default async function SubscriptionsPage() {
  const subs = await getCustomerSubscriptions();
  // Las canceladas quedan al final, como historial.
  const current = subs.filter((s) => s.status !== "CANCELLED");
  const cancelled = subs.filter((s) => s.status === "CANCELLED");

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Tu café, automático</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis suscripciones
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Cada envío de una suscripción genera un pedido que se paga igual que el primero. Puedes
          pausarla, saltar un envío o cancelarla cuando quieras.
        </p>
      </header>

      {subs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Aún no tienes suscripciones.</p>
          <Button
            className="mt-4"
            variant="outline"
            render={<Link href="/catalogo">Explorar cafés</Link>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((s) => (
            <SubscriptionCard key={s.id} sub={s} />
          ))}
          {cancelled.length > 0 && (
            <>
              <h2 className="pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Canceladas
              </h2>
              {cancelled.map((s) => (
                <SubscriptionCard key={s.id} sub={s} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
