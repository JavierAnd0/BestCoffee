import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EnviaConnectionForm } from "@/components/admin/envia-connection-form";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getAdminSettings, getEpaycoStatus } from "@/lib/data/admin";
import { getEnviaStatus } from "@/lib/data/shipping";
import { AdminSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const { mp } = await searchParams;
  const [tenant, settings, epayco, envia] = await Promise.all([
    getCurrentTenant(),
    getAdminSettings(),
    getEpaycoStatus(),
    getEnviaStatus(),
  ]);
  const mpConnected = tenant.paymentProvider === "mercadopago" && !!tenant.mpPublicKey;

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description={`Ajustes globales de ${tenant.name}.`} />
      <AdminSettingsForm
        mpConnected={mpConnected}
        epayco={epayco}
        // Regreso de la autorización de MercadoPago (?mp=connected | error).
        mpResult={mp === "connected" || mp === "error" ? mp : null}
        settings={settings}
        // Lo que cobra hoy el carrito si la tienda no fijó sus propios montos.
        effectiveFreeShippingCents={tenant.freeShippingThresholdCents}
        effectiveShippingFlatCents={tenant.shippingFlatCents}
      />
      <section className="rounded-lg border border-border bg-background p-6">
        <header className="flex items-center gap-3 mb-5">
          <span className="size-9 rounded-md bg-muted grid place-items-center">
            <Truck className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Guías de envío (Envia)</h2>
            <p className="text-xs text-muted-foreground">
              Conecta tu cuenta de Envia.com para cotizar con Coordinadora, Servientrega,
              Interrapidísimo y más, generar la guía desde cada pedido y que el estado se
              actualice solo. Las guías se pagan con tu saldo de Envia.
            </p>
          </div>
        </header>
        <EnviaConnectionForm status={envia} />
      </section>
    </div>
  );
}
