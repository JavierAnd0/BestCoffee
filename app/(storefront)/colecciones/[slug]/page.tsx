import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProductCard } from "@/components/storefront/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getStoreCollection } from "@/lib/data/store-collections";
import { breadcrumbLd, getSiteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getCurrentTenant();
  const collection = tenant.features.catalog ? await getStoreCollection(slug) : null;
  if (!collection) return { title: "Colección no encontrada" };
  const description =
    collection.description ?? `${collection.name}: selección de ${tenant.brand}.`;
  return {
    title: collection.name,
    description,
    alternates: { canonical: `/colecciones/${collection.slug}` },
    openGraph: {
      type: "website",
      siteName: tenant.brand,
      locale: "es_CO",
      url: `/colecciones/${collection.slug}`,
      title: collection.name,
      description,
      ...(collection.products[0]?.images[0] && {
        images: [{ url: collection.products[0].images[0].url, alt: collection.name }],
      }),
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant.features.catalog) notFound();
  const [collection, siteUrl] = await Promise.all([getStoreCollection(slug), getSiteUrl()]);
  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Inicio", path: "/" },
          { name: "Colecciones", path: "/colecciones" },
          { name: collection.name, path: `/colecciones/${collection.slug}` },
        ])}
      />
      <nav className="text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href="/colecciones" className="hover:text-foreground">
          Colecciones
        </Link>{" "}
        / <span className="text-foreground">{collection.name}</span>
      </nav>

      <div className="mb-10 pb-6 border-b border-border">
        <Eyebrow>Colección</Eyebrow>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            {collection.description}
          </p>
        )}
      </div>

      {collection.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Esta colección todavía no tiene productos disponibles.
          </p>
          <Link href="/catalogo" className="mt-4 inline-block text-xs text-primary underline">
            Ver todo el catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {collection.products.map((p) => (
            <ProductCard key={p.id} product={p} imageHeight={200} />
          ))}
        </div>
      )}
    </div>
  );
}
