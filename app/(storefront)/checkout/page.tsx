import type { Metadata } from "next";
import { CheckoutWizard } from "@/components/storefront/checkout-wizard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { requireFeature } from "@/lib/data/feature-guard";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  await requireFeature("checkout");
  const tenant = await getCurrentTenant();
  return (
    <CheckoutWizard
      paymentProvider={tenant.paymentProvider ?? null}
      mpPublicKey={tenant.mpPublicKey ?? null}
      useMocks={env.useMocks}
    />
  );
}
