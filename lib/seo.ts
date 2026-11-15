import { headers } from "next/headers";
import type { Product, Tenant } from "./types";

/**
 * URL pública del sitio según el host de la petición. En un front multi-tenant
 * cada tienda vive en su propio dominio, así que canónicas, sitemap y datos
 * estructurados se construyen por petición y nunca con un dominio fijo.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.includes(".localhost");
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}

/** Descripción de la tienda según lo que su plan permite hacer en el sitio. */
export function tenantDescription(tenant: Tenant): string {
  const acciones: string[] = [];
  if (tenant.features.checkout) acciones.push("compra en línea con envío a toda Colombia");
  else if (tenant.features.catalog) acciones.push("conoce el catálogo y los precios");
  if (tenant.features.subscriptions) acciones.push("suscríbete para recibir café fresco cada mes");
  const cola = acciones.length ? ` ${capitalize(acciones.join(" y "))}.` : "";
  return `${tenant.brand}: café de especialidad colombiano, tostado en lotes pequeños.${cola}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Precio mínimo y máximo (en pesos, no centavos) entre las variantes de un producto. */
export function priceRange(product: Product): { low: number; high: number; count: number } | null {
  const prices = product.variants
    .map((v) => v.priceOneTimeCents)
    .filter((c) => Number.isFinite(c) && c > 0)
    .map((c) => Math.round(c / 100));
  if (!prices.length) return null;
  return { low: Math.min(...prices), high: Math.max(...prices), count: prices.length };
}

/* ───────────── Datos estructurados (schema.org) ───────────── */

export function organizationLd(tenant: Tenant, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: tenant.brand,
    url: siteUrl,
    description: tenantDescription(tenant),
  };
}

export function websiteLd(tenant: Tenant, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: tenant.brand,
    url: siteUrl,
    inLanguage: "es-CO",
    publisher: { "@id": `${siteUrl}/#organization` },
    ...(tenant.features.catalog && {
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/catalogo?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    }),
  };
}

/**
 * Producto. Deliberadamente SIN `aggregateRating`: solo debe publicarse con
 * reseñas reales de la tienda, nunca con un valor de relleno.
 */
export function productLd(product: Product, tenant: Tenant, siteUrl: string) {
  const range = priceRange(product);
  const inStock = product.variants.some((v) => v.stock > 0);
  const url = `${siteUrl}/p/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.longDescription ?? product.shortDescription,
    url,
    sku: product.id,
    category: product.type === "ACCESSORY" ? "Accesorios de café" : "Café de especialidad",
    brand: { "@type": "Brand", name: tenant.brand },
    ...(product.images.length && { image: product.images.map((i) => i.url) }),
    ...(product.origin && { countryOfOrigin: product.origin }),
    ...(product.flavorNotes.length && {
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Notas de sabor",
          value: product.flavorNotes.join(", "),
        },
      ],
    }),
    ...(range && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: tenant.currency,
        lowPrice: range.low,
        highPrice: range.high,
        offerCount: range.count,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url,
        seller: { "@id": `${siteUrl}/#organization` },
      },
    }),
  };
}

export function breadcrumbLd(siteUrl: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
