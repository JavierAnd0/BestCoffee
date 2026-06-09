import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SubscriptionCard } from "@/components/storefront/subscription-card";
import { getCustomerSubscriptions } from "@/lib/data/account";

export const metadata: Metadata = { title: "Mis suscripciones" };

export default async function SubscriptionsPage() {
  const subs = await getCustomerSubscriptions();
  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Tu café, automático</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis suscripciones
        </h1>
      </header>
      <div className="space-y-4">
        {subs.map((s) => (
          <SubscriptionCard key={s.id} sub={s} />
        ))}
      </div>
    </div>
  );
}
