import { BrandProvider } from "@/components/storefront/brand-context";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getTenantSlug } from "@/lib/tenant";

/**
 * Acceso de operadores. En el dominio de una tienda muestra su marca; en el de
 * la plataforma (sin tienda), la de la plataforma.
 */
export default async function AccesoLayout({ children }: { children: React.ReactNode }) {
  const tenant = (await getTenantSlug()) ? await getCurrentTenant().catch(() => null) : null;
  return (
    <BrandProvider brand={tenant?.brand ?? "Bestkofi"} logoUrl={tenant?.branding.logoUrl ?? null}>
      {children}
    </BrandProvider>
  );
}
