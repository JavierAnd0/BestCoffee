import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminBilling, getCurrentOperator } from "@/lib/data/admin";
import { getCurrentTenant } from "@/lib/data/tenant";
import { BrandProvider } from "@/components/storefront/brand-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getCurrentOperator();
  if (!operator) {
    redirect("/acceso");
  }
  // El menú solo muestra lo que el plan de la tienda incluye. Si no se puede
  // leer el plan, se muestra completo (el backend igual bloquea con 402).
  const [tenant, billing] = await Promise.all([
    getCurrentTenant().catch(() => null),
    getAdminBilling(),
  ]);
  const billingNotice =
    billing?.billingStatus === "PAST_DUE"
      ? "Tu plan tiene un pago pendiente. Regularízalo para evitar la suspensión de la tienda."
      : billing?.billingStatus === "CANCELLED" || billing?.billingStatus === "INACTIVE"
        ? "Tu tienda está suspendida: el sitio público no se muestra ni recibe pedidos. Contacta a la plataforma para reactivarla."
        : null;

  return (
    <BrandProvider brand={tenant?.brand ?? "Panel"} logoUrl={tenant?.branding.logoUrl ?? null}>
    <div className="flex min-h-screen">
      <AdminSidebar operator={operator} features={tenant?.features ?? null} />
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
