import type { Metadata } from "next";
import { requireFeature } from "@/lib/data/feature-guard";
import { getCurrentTenant } from "@/lib/data/tenant";

// Depende del tenant de cada petición (host): nunca debe prerenderizarse en el build.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: { default: `Iniciar sesión · ${tenant.brand}`, template: `%s · ${tenant.brand}` },
  };
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Las cuentas de cliente son una capacidad de plan (PRO+). En tiendas STARTER
  // no hay login/registro: redirige al storefront.
  await requireFeature("customerAccounts");
  return <>{children}</>;
}
