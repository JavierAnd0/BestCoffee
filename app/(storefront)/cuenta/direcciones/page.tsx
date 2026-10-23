import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCustomerAddresses } from "@/lib/data/account";
import { AddressManager } from "@/components/storefront/address-manager";

export const metadata: Metadata = {
  title: "Mis Direcciones",
  description: "Administra tus direcciones de entrega para pedidos y suscripciones de café.",
};

export default async function AddressesPage() {
  const addresses = await getCustomerAddresses();

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Envío y Entrega</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis direcciones
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administra las direcciones donde recibes tus pedidos de café fresco y suscripciones.
        </p>
      </header>

      <AddressManager initialAddresses={addresses} />
    </div>
  );
}
