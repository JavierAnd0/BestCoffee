import type { Metadata } from "next";
import { CheckoutWizard } from "@/components/storefront/checkout-wizard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { requireFeature } from "@/lib/data/feature-guard";
import { getCurrentCustomer, getCustomerAddresses } from "@/lib/data/account";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Checkout · Finalizar Compra",
  description: "Completa tus datos de envío y pago para recibir café recién tostado.",
};

export default async function CheckoutPage() {
  await requireFeature("checkout");

  const [tenant, customer, addresses] = await Promise.all([
    getCurrentTenant(),
    getCurrentCustomer().catch(() => null),
    getCustomerAddresses().catch(() => []),
  ]);

  return (
    <CheckoutWizard
      paymentProvider={tenant.paymentProvider ?? null}
      mpPublicKey={tenant.mpPublicKey ?? null}
      useMocks={env.useMocks}
      // Cobro en línea = el plan lo incluye Y hay una pasarela real conectada.
      // Sin ella no se piden datos de tarjeta: el pedido queda con pago por fuera.
      onlinePayments={
        tenant.features.onlinePayments &&
        tenant.paymentProvider === "mercadopago" &&
        Boolean(tenant.mpPublicKey)
      }
      customer={customer}
      savedAddresses={addresses}
      canSubscribe={tenant.features.subscriptions}
    />
  );
}
