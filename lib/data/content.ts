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
import {
  ANNOUNCE_MESSAGES,
  HERO_HOME,
  SPOTLIGHT_HOME,
  FEATURED_PACK_HOME,
} from "../mocks/site-content";

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
    eyebrow: "Origen único · spotlight",
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
  const priceCents = products.reduce(
    (sum, p) => sum + (p ? cheapestPriceCents(p) : 0),
    0,
  );
  return {
    eyebrow: "Paquete destacado",
    title: bundle.title,
    description:
      "Una selección curada de nuestros orígenes para descubrir tu favorito.",
    priceCents,
    bagsCount: slugs.length,
    savingsPct: 12,
    productSlug: slugs[0] ?? "",
  };
}
