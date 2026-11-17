import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { TwoFactorSettings } from "@/components/admin/two-factor-settings";
import { getMfaStatus } from "@/lib/actions/operator-mfa";

export const metadata: Metadata = { title: "Seguridad · Admin" };

export default async function AdminSecurityPage() {
  const status = await getMfaStatus();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguridad"
        description="Protege tu acceso al panel con un segundo paso además del enlace por correo."
      />
      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Verificación en dos pasos</h2>
        <TwoFactorSettings initial={status} />
      </section>
    </div>
  );
}
