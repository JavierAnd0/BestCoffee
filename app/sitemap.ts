import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getTenantSlug } from "@/lib/tenant";
import { getCurrentTenant } from "@/lib/data/tenant";
import { listProducts } from "@/lib/data/products";
import { listBlogPosts } from "@/lib/data/blog";
import { listBrewGuides } from "@/lib/data/static";

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
  const f = tenant.features;
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
    page("/quiz", 0.6),
    page("/tiendas", 0.6),
    page("/historia", 0.5),
    page("/impacto", 0.5),
    page("/sostenibilidad", 0.5),
    page("/mayoristas", 0.5),
    page("/contacto", 0.5),
    page("/envios", 0.4),
    page("/devoluciones", 0.4),
    page("/legal/terminos", 0.2, "yearly"),
    page("/legal/privacidad", 0.2, "yearly"),
  ];

  const [products, posts, guides] = await Promise.all([
    f.catalog ? safe(listProducts) : [],
    f.blog ? safe(listBlogPosts) : [],
    safe(listBrewGuides),
  ]);

  for (const p of products) entries.push(page(`/p/${p.slug}`, 0.8, "weekly"));
  for (const post of posts) entries.push(page(`/blog/${post.slug}`, 0.6));
  for (const g of guides) entries.push(page(`/guias/${g.slug}`, 0.6));

  return entries;
}
