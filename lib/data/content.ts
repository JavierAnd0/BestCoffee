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
  hero: ApiHeroBlock;
  spotlight: { data: { title: string; productSlug: string } };
  featuredBundle: { data: { title: string; productSlugs: string[] } };
}

async function fetchHome(): Promise<HomeContent> {
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/content/home");
  if (error || !data) throw new Error("API GET /v1/content/home failed");
  return data as unknown as HomeContent;
}

export async function getAnnounceMessages(): Promise<AnnounceMessage[]> {
  if (env.useMocks) return ANNOUNCE_MESSAGES;
  const home = await fetchHome();
  return mapAnnouncements(home.announcements);
}

export async function getHomeHero(): Promise<HeroContent> {
  if (env.useMocks) return HERO_HOME;
  const home = await fetchHome();
  return mapHero(home.hero);
}

export async function getHomeSpotlight(): Promise<SpotlightContent> {
  if (env.useMocks) return SPOTLIGHT_HOME;
  const home = await fetchHome();
  const slug = home.spotlight.data.productSlug;
  const product = await getProductBySlug(slug);
  if (!product) return SPOTLIGHT_HOME;
  return {
    eyebrow: "Origen único · spotlight",
    title: home.spotlight.data.title ?? product.name,
    body: product.shortDescription || product.producerStory || "",
    roastLevel: product.roastLevel,
    flavorNotes: product.flavorNotes,
    priceCents: cheapestPriceCents(product),
    productSlug: slug,
    imageAlt: product.images[0]?.alt ?? product.name,
  };
}

export async function getFeaturedPack(): Promise<FeaturedPackContent> {
  if (env.useMocks) return FEATURED_PACK_HOME;
  const home = await fetchHome();
  const slugs = home.featuredBundle.data.productSlugs ?? [];
  // Price the bundle as the sum of each product's cheapest variant.
  const products = await Promise.all(slugs.map((s) => getProductBySlug(s)));
  const priceCents = products.reduce(
    (sum, p) => sum + (p ? cheapestPriceCents(p) : 0),
    0,
  );
  return {
    eyebrow: "Paquete destacado",
    title: home.featuredBundle.data.title,
    description:
      "Una selección curada de nuestros orígenes para descubrir tu favorito.",
    priceCents,
    bagsCount: slugs.length,
    savingsPct: 12,
    productSlug: slugs[0] ?? "",
  };
}
