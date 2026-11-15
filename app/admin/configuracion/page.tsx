import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { getCurrentTenant } from "@/lib/data/tenant";
import { AdminSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default async function AdminSettingsPage() {
  const tenant = await getCurrentTenant();
  const mpConnected = tenant.paymentProvider === "mercadopago" && !!tenant.mpPublicKey;

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Ajustes globales de la tienda." />
      <AdminSettingsForm mpConnected={mpConnected} />
    </div>
  );
}
