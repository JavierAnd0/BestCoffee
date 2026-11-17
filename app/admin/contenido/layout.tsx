import { PageHeader } from "@/components/admin/page-header";
import { getCurrentTenant } from "@/lib/data/tenant";
import { ContentTabs, type ContentTab } from "./_components/content-tabs";

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant().catch(() => null);
  // Sin dato del plan se muestran todas (el backend igual responde 402).
  const tabs: ContentTab[] = [
    { href: "/admin/contenido", label: "Inicio" },
    ...(tenant && !tenant.features.blog ? [] : [{ href: "/admin/contenido/blog", label: "Blog" }]),
    { href: "/admin/contenido/guias", label: "Guías de preparación" },
    { href: "/admin/contenido/sedes", label: "Sedes" },
  ];
  return (
    <div>
      <PageHeader title="Contenido del sitio" description="Lo que se ve en la tienda pública." />
      <ContentTabs tabs={tabs} />
      {children}
    </div>
  );
}
