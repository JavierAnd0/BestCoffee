import type { Metadata } from "next";
import { TwoFactorSettings } from "@/components/admin/two-factor-settings";
import { getMfaStatus } from "@/lib/actions/operator-mfa";

export const metadata: Metadata = { title: "Seguridad · Superadmin" };

export default async function SuperadminSecurityPage() {
  const status = await getMfaStatus();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Seguridad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta controla todas las tiendas: protégela con un segundo paso.
        </p>
      </div>
      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Verificación en dos pasos</h2>
        <TwoFactorSettings initial={status} />
      </section>
    </div>
  );
}
