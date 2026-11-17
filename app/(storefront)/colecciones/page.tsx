import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentTenant } from "@/lib/data/tenant";
import { listStoreCollections } from "@/lib/data/store-collections";
import { breadcrumbLd, getSiteUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  const description = `Selecciones de ${tenant.brand}: cafés y productos agrupados para elegir más fácil.`;
  return {
    title: "Colecciones",
    description,
    alternates: { canonical: "/colecciones" },
    openGraph: {
      type: "website",
      siteName: tenant.brand,
      locale: "es_CO",
      url: "/colecciones",
      title: `Colecciones · ${tenant.brand}`,
      description,
    },
  };
}

export default async function CollectionsIndexPage() {
  const tenant = await getCurrentTenant();
  // Las colecciones son parte del catálogo: sin catálogo (o sin colecciones) la ruta no existe.
  if (!tenant.features.catalog) notFound();
  const [collections, siteUrl] = await Promise.all([listStoreCollections(), getSiteUrl()]);
  if (collections.length === 0) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Inicio", path: "/" },
          { name: "Colecciones", path: "/colecciones" },
        ])}
      />
      <nav className="text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>{" "}
        / <span className="text-foreground">Colecciones</span>
      </nav>

      <div className="mb-10 pb-6 border-b border-border">
        <Eyebrow>Selecciones</Eyebrow>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
          Colecciones
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/colecciones/${c.slug}`}
            className="group block border border-border p-6 hover:border-foreground/40 transition-colors"
          >
            <h2 className="font-display text-2xl font-semibold tracking-tight">{c.name}</h2>
            {c.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {c.description}
              </p>
            )}
            <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Ver colección
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
