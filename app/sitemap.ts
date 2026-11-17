import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getTenantSlug } from "@/lib/tenant";
import { getCurrentTenant } from "@/lib/data/tenant";
import { listProducts } from "@/lib/data/products";
import { listBlogPosts } from "@/lib/data/blog";
import { listBrewGuides } from "@/lib/data/static";
import { listStoreCollections } from "@/lib/data/store-collections";

// Depende del host (tienda) de cada petición.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/** Una lista vacía es mejor que un sitemap roto si una fuente de datos falla. */
async function safe<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();

  // Host de la plataforma (sin tienda): solo su página de presentación.
  if (!(await getTenantSlug())) {
    return [{ url: siteUrl, changeFrequency: "monthly", priority: 1 }];
  }

  const tenant = await getCurrentTenant();
  // Tienda suspendida por cobro: no anuncia ninguna URL.
  if (tenant.suspended) return [];
  const f = tenant.features;
  const pages = tenant.branding.pages;
  const page = (
    path: string,
    priority: number,
    changeFrequency: Entry["changeFrequency"] = "monthly",
  ): Entry => ({ url: `${siteUrl}${path}`, priority, changeFrequency });

  // Solo se listan las secciones que el plan de la tienda tiene activas.
  const entries: Entry[] = [
    page("", 1, "weekly"),
    ...(f.catalog ? [page("/catalogo", 0.9, "daily")] : []),
    ...(f.catalog && f.accessories ? [page("/accesorios", 0.8, "weekly")] : []),
    ...(f.subscriptions ? [page("/suscripciones", 0.8)] : []),
    ...(f.blog ? [page("/blog", 0.7, "weekly")] : []),
    page("/guias", 0.7),
    ...(f.catalog ? [page("/quiz", 0.6)] : []),
    // Páginas editoriales: solo las que la tienda tiene (el resto dan 404).
    ...(pages.tiendas ? [page("/tiendas", 0.6)] : []),
    ...(pages.historia ? [page("/historia", 0.5)] : []),
    ...(pages.impacto ? [page("/impacto", 0.5)] : []),
    ...(pages.sostenibilidad ? [page("/sostenibilidad", 0.5)] : []),
    ...(pages.mayoristas ? [page("/mayoristas", 0.5)] : []),
    page("/contacto", 0.5),
    page("/envios", 0.4),
    page("/devoluciones", 0.4),
    page("/legal/terminos", 0.2, "yearly"),
    page("/legal/privacidad", 0.2, "yearly"),
  ];

  const [products, posts, guides, collections] = await Promise.all([
    f.catalog ? safe(listProducts) : [],
    f.blog ? safe(listBlogPosts) : [],
    safe(listBrewGuides),
    f.catalog ? safe(listStoreCollections) : [],
  ]);

  for (const p of products) entries.push(page(`/p/${p.slug}`, 0.8, "weekly"));
  for (const post of posts) entries.push(page(`/blog/${post.slug}`, 0.6));
  for (const g of guides) entries.push(page(`/guias/${g.slug}`, 0.6));
  if (collections.length) entries.push(page("/colecciones", 0.7, "weekly"));
  for (const c of collections) entries.push(page(`/colecciones/${c.slug}`, 0.7, "weekly"));

  return entries;
}
