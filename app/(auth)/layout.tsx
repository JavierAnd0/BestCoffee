import type { Metadata } from "next";
import { requireFeature } from "@/lib/data/feature-guard";

export const metadata: Metadata = {
  title: { default: "Iniciar sesión · ORÍGEN", template: "%s · ORÍGEN" },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Las cuentas de cliente son una capacidad de plan (PRO+). En tiendas STARTER
  // no hay login/registro: redirige al storefront.
  await requireFeature("customerAccounts");
  return <>{children}</>;
}
