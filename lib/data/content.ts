import { env } from "../env";
import { apiServer } from "../api/client";
import {
  mapAnnouncements,
  mapHero,
  cheapestPriceCents,
  type ApiAnnouncement,
  type ApiHeroBlock,
} from "../api/mappers";
import { getProductBySlug } from "./products";
import { headers } from "next/headers";
import { tenantCacheTag } from "./cache-tags";
import type { ContentPageSlug, EditorialPageContent } from "../editorial-pages";
import {
  ANNOUNCE_MESSAGES,
  HERO_HOME,
  SPOTLIGHT_HOME,
  FEATURED_PACK_HOME,
} from "../mocks/site-content";
import { EDITORIAL_PAGES } from "../mocks/editorial-pages";

// Política multi-tenant: el contenido demo (ORÍGEN) solo existe con USE_MOCKS.
// En modo real, si la tienda no configuró un bloque, devuelve null/[] y la
// página oculta la sección — nunca se rellena con textos de otra tienda.
import type {
  AnnounceMessage,
  HeroContent,
  SpotlightContent,
  FeaturedPackContent,
} from "../types";

// Shape of GET /v1/content/home. Next dedupes the fetch within one render, so
// the four content getters below hit the network once total.
interface HomeContent {
  announcements: ApiAnnouncement[];
  hero: ApiHeroBlock | null;
  spotlight: { data: { title: string; productSlug: string } } | null;
  featuredBundle: { data: { title: string; productSlugs: string[] } } | null;
}

async function fetchHome(): Promise<HomeContent | null> {
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/content/home");
    if (error || !data) return null;
    return data as unknown as HomeContent;
  } catch {
    return null;
  }
}

export async function getAnnounceMessages(): Promise<AnnounceMessage[]> {
  if (env.useMocks) return ANNOUNCE_MESSAGES;
  const home = await fetchHome();
  if (!home) return [];
  return mapAnnouncements(home.announcements ?? []);
}

export async function getHomeHero(): Promise<HeroContent | null> {
  if (env.useMocks) return HERO_HOME;
  const home = await fetchHome();
  if (!home?.hero?.data?.title) return null;
  return mapHero(home.hero);
}

export async function getHomeSpotlight(): Promise<SpotlightContent | null> {
  if (env.useMocks) return SPOTLIGHT_HOME;
  const home = await fetchHome();
  const spot = home?.spotlight?.data;
  if (!spot?.productSlug) return null;
  const product = await getProductBySlug(spot.productSlug);
  if (!product) return null;
  return {
    eyebrow: "Destacado",
    title: spot.title ?? product.name,
    body: product.shortDescription || product.producerStory || "",
    roastLevel: product.roastLevel,
    flavorNotes: product.flavorNotes,
    priceCents: cheapestPriceCents(product),
    productSlug: spot.productSlug,
    imageAlt: product.images[0]?.alt ?? product.name,
  };
}

export async function getFeaturedPack(): Promise<FeaturedPackContent | null> {
  if (env.useMocks) return FEATURED_PACK_HOME;
  const home = await fetchHome();
  const bundle = home?.featuredBundle?.data;
  const slugs = bundle?.productSlugs ?? [];
  if (!bundle || slugs.length === 0) return null;
  // Price the bundle as the sum of each product's cheapest variant.
  const products = await Promise.all(slugs.map((s) => getProductBySlug(s)));
  // Sin precio propio de paquete: no hay ahorro que anunciar.
  const found = products.filter((p) => p !== null && p !== undefined);
  const priceCents = found.reduce((sum, p) => sum + cheapestPriceCents(p), 0);
  return {
    eyebrow: "Paquete destacado",
    title: bundle.title,
    description: "Una selección de la tienda para descubrir tu favorito.",
    priceCents,
    bagsCount: found.length,
    productSlug: slugs[0] ?? "",
  };
}

// ── Páginas editoriales (historia, impacto, sostenibilidad, mayoristas) ───────

/**
 * Contenido de una página editorial de la tienda actual. `null` si la tienda la
 * tiene apagada, no la ha escrito o la API falla: la página responde 404 y
 * nunca se rellena con el texto de otra marca. Con mocks no hay contenido.
 */
export async function getEditorialPage(slug: ContentPageSlug): Promise<EditorialPageContent | null> {
  if (env.useMocks) return EDITORIAL_PAGES[slug] ?? null;
  try {
    const h = await headers();
    const tenantSlug = h.get("x-tenant-slug") ?? env.defaultTenantSlug;
    const res = await fetch(`${env.apiUrlInternal}/v1/content/pages/${encodeURIComponent(slug)}`, {
      headers: { "X-Tenant-Slug": tenantSlug },
      // La API revalida estas etiquetas al guardar la página (app/api/revalidate).
      next: {
        revalidate: 3600,
        tags: [tenantCacheTag(tenantSlug, "pages"), tenantCacheTag(tenantSlug, `page:${slug}`)],
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<EditorialPageContent> | null;
    if (!data || typeof data.title !== "string" || !data.title.trim()) return null;
    return { ...data, title: data.title, sections: Array.isArray(data.sections) ? data.sections : [] };
  } catch {
    return null;
  }
}
