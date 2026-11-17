import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Roast } from "@/components/ui/roast";
import { Stars } from "@/components/ui/stars";
import { BuyBlock } from "@/components/storefront/buy-block";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { getProductBySlug, listRelated } from "@/lib/data/products";
import { getCurrentTenant } from "@/lib/data/tenant";
import { requireFeature } from "@/lib/data/feature-guard";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd, getSiteUrl, productLd } from "@/lib/seo";
import { getProductReviews, getVerifiedCustomerEmail } from "@/lib/data/reviews";
import { ProductReviewsSection } from "@/components/storefront/product-reviews";

const TYPE_LABEL = {
  BLEND: "Mezcla",
  SINGLE_ORIGIN: "Origen único",
  DECAF: "Descafeinado",
  ACCESSORY: "Accesorio de Barismo",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const image = product.images[0];
  const tenant = await getCurrentTenant();
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: {
      type: "website",
      // Definir openGraph aquí reemplaza al del layout: se repiten sitio e idioma.
      siteName: tenant.brand,
      locale: "es_CO",
      url: `/p/${product.slug}`,
      title: product.name,
      description: product.shortDescription,
      // Con foto propia se comparte la del producto; sin ella, la imagen de la tienda.
      ...(image && { images: [{ url: image.url, alt: image.alt ?? product.name }] }),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireFeature("catalog");
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, tenant, siteUrl] = await Promise.all([
    listRelated(product),
    getCurrentTenant(),
    getSiteUrl(),
  ]);
  // Reseñas: solo si el plan de la tienda las incluye, y siempre con datos reales.
  const [reviews, sessionEmail] = tenant.features.reviews
    ? await Promise.all([getProductReviews(product.slug), getVerifiedCustomerEmail()])
    : [null, null];
  const ld = productLd(product, tenant, siteUrl);

  return (
    <>
      <JsonLd
        data={[
          reviews?.average != null
            ? {
                ...ld,
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: reviews.average,
                  reviewCount: reviews.count,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : ld,
          breadcrumbLd(siteUrl, [
            { name: "Inicio", path: "/" },
            { name: "Catálogo", path: "/catalogo" },
            { name: product.name, path: `/p/${product.slug}` },
          ]),
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-muted-foreground mb-6">
          Inicio / Catálogo /{" "}
          <span className="text-foreground">{TYPE_LABEL[product.type]}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <Badge variant="outline" className="font-normal uppercase tracking-[0.12em]">
              {TYPE_LABEL[product.type]}
              {product.origin ? ` · ${product.origin}` : ""}
            </Badge>
            <h1 className="mt-4 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
              {product.name}
            </h1>
            {reviews?.average != null && (
              <a href="#resenas" className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <Stars value={Math.round(reviews.average)} />
                <span>
                  {reviews.average.toLocaleString("es-CO")} · {reviews.count}{" "}
                  {reviews.count === 1 ? "reseña" : "reseñas"}
                </span>
              </a>
            )}
            {product.type !== "ACCESSORY" && (
              <div className="mt-6">
                <Roast level={product.roastLevel} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {product.flavorNotes.map((n) => (
                <Badge key={n} variant="outline" className="font-normal">
                  {n}
                </Badge>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-md">
              {product.shortDescription}
            </p>

            <div className="mt-10 border-t border-border pt-8">
              <BuyBlock
                product={product}
                canCheckout={tenant.features.checkout}
                canSubscribe={tenant.features.subscriptions}
              />
            </div>
          </div>
        </div>
      </section>

      {product.producerStory && (
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div
              aria-label="Retrato del productor"
              className="aspect-[4/3] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
            >
              Retrato del productor
            </div>
            <div>
              <Eyebrow>Historia del origen</Eyebrow>
              <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-tight">
                {product.origin ?? "Sobre este café"}
              </h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                {product.producerStory}
              </p>
              {product.longDescription && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {product.longDescription}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {reviews && (
        <ProductReviewsSection
          productSlug={product.slug}
          summary={reviews}
          sessionEmail={sessionEmail}
        />
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Eyebrow>También te podría gustar</Eyebrow>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-tight">
              Más cafés
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} imageHeight={200} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
