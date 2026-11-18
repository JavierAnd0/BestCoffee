import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getAdminSettings } from "@/lib/data/admin";
import { AdminSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const { mp } = await searchParams;
  const [tenant, settings] = await Promise.all([getCurrentTenant(), getAdminSettings()]);
  const mpConnected = tenant.paymentProvider === "mercadopago" && !!tenant.mpPublicKey;

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description={`Ajustes globales de ${tenant.name}.`} />
      <AdminSettingsForm
        mpConnected={mpConnected}
        // Regreso de la autorización de MercadoPago (?mp=connected | error).
        mpResult={mp === "connected" || mp === "error" ? mp : null}
        settings={settings}
        // Lo que cobra hoy el carrito si la tienda no fijó sus propios montos.
        effectiveFreeShippingCents={tenant.freeShippingThresholdCents}
        effectiveShippingFlatCents={tenant.shippingFlatCents}
      />
    </div>
  );
}
