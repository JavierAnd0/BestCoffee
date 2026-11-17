import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminBilling, getCurrentOperator } from "@/lib/data/admin";
import { getCurrentTenant } from "@/lib/data/tenant";
import { listAuditPage } from "@/lib/data/admin-audit";
import { BrandProvider } from "@/components/storefront/brand-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getCurrentOperator();
  if (!operator) {
    redirect("/acceso");
  }
  // El menú solo muestra lo que el plan de la tienda incluye. Si no se puede
  // leer el plan, se muestra completo (el backend igual bloquea con 402).
  // El rol del operador en esta tienda no viene en /v1/auth/me: se deduce de la
  // bitácora (solo TENANT_OWNER la lee; al resto la API le responde 403).
  const [tenant, billing, auditProbe] = await Promise.all([
    getCurrentTenant().catch(() => null),
    getAdminBilling(),
    listAuditPage({}, undefined, 1),
  ]);
  const isOwner = auditProbe.ok || auditProbe.status !== 403;
  const billingNotice =
    billing?.billingStatus === "PAST_DUE"
      ? "Tu plan tiene un pago pendiente. Regularízalo para evitar la suspensión de la tienda."
      : billing?.billingStatus === "CANCELLED" || billing?.billingStatus === "INACTIVE"
        ? "Tu tienda está suspendida: el sitio público no se muestra ni recibe pedidos. Contacta a la plataforma para reactivarla."
        : null;

  return (
    <BrandProvider brand={tenant?.brand ?? "Panel"} logoUrl={tenant?.branding.logoUrl ?? null}>
    <div className="flex min-h-screen">
      <AdminSidebar operator={operator} features={tenant?.features ?? null} isOwner={isOwner} />
      <div className="flex-1 min-w-0 bg-muted/30">
        {billingNotice && (
          <div
            role="alert"
            className="border-b border-amber-500/30 bg-amber-500/10 px-8 py-3 text-sm text-amber-900"
          >
            {billingNotice}
          </div>
        )}
        <main className="max-w-7xl mx-auto p-8">{children}</main>
      </div>
    </div>
    </BrandProvider>
  );
}
