// Maps backend (NestJS) response shapes to the front's domain types.
// The API and the front were designed independently, so a thin adapter keeps
// component code stable regardless of small naming differences.

import type {
  Product,
  Tenant,
  TenantFeatures,
  AnnounceMessage,
  HeroContent,
} from "../types";

// ── Minimal shapes of what the API returns (only the fields we read) ─────────
export interface ApiVariant {
  id: string;
  sizeGrams: number;
  grind: string;
  priceOneTime: number;
  priceSubscription: number | null;
  stock: number;
}

export interface ApiImage {
  id: string;
  url: string;
  alt?: string | null;
  position: number;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  type: string;
  origin?: string | null;
  description?: string | null;
  producerStory?: string | null;
  roastLevel: number;
  flavorNotes?: string[] | null;
  badges?: string[] | null;
  status: string;
  subscriptionAvailability: string;
  images?: ApiImage[] | null;
  variants?: ApiVariant[] | null;
  collectionSlugs?: string[] | null;
}

export interface ApiTenant {
  slug: string;
  name: string;
  tier?: string;
  features?: Record<string, unknown>;
  branding?: { accent?: string; primary?: string; font?: string };
  paymentProvider?: string | null;
  mpPublicKey?: string | null;
}

interface ApiCta {
  href: string;
  label: string;
}
export interface ApiAnnouncement {
  id: string;
  data: { text: string; cta?: ApiCta | null };
  position: number;
}
export interface ApiHeroBlock {
  data: {
    title: string;
    subtitle?: string;
    cta?: ApiCta | null;
    imageDesktop?: string;
    imageMobile?: string;
  };
}

// ── Mappers ──────────────────────────────────────────────────────────────────
export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: (p.type as Product["type"]) ?? "BLEND",
    origin: p.origin ?? undefined,
    producerStory: p.producerStory ?? undefined,
    shortDescription: p.description ?? "",
    longDescription: p.description ?? undefined,
    roastLevel: p.roastLevel ?? 5,
    flavorNotes: p.flavorNotes ?? [],
    badges: p.badges ?? [],
    status: (p.status as Product["status"]) ?? "ACTIVE",
    subscriptionAvailability:
      (p.subscriptionAvailability as Product["subscriptionAvailability"]) ?? "YES",
    images: (p.images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? undefined })),
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      sizeGrams: v.sizeGrams,
      grind: (v.grind as Product["variants"][number]["grind"]) ?? "WHOLE_BEAN",
      priceOneTimeCents: v.priceOneTime,
      priceSubscriptionCents: v.priceSubscription,
      stock: v.stock,
    })),
    collectionSlugs: p.collectionSlugs ?? [],
  };
}

// Baseline por tier, espejo de TIER_FEATURES del backend. Solo se usa como
// fallback si el backend (versión vieja) no envía `features` ya resueltas.
const TIER_FALLBACK: Record<string, TenantFeatures> = {
  STARTER: {
    blog: true, catalog: true, checkout: false, customerAccounts: false,
    subscriptions: false, discountCodes: false, reviews: false,
    gifts: false, customDomain: false, maxProducts: 10,
  },
  PRO: {
    blog: true, catalog: true, checkout: true, customerAccounts: true,
    subscriptions: true, discountCodes: true, reviews: true,
    gifts: false, customDomain: false, maxProducts: 50,
  },
  BUSINESS: {
    blog: true, catalog: true, checkout: true, customerAccounts: true,
    subscriptions: true, discountCodes: true, reviews: true,
    gifts: true, customDomain: true, maxProducts: -1,
  },
};

function resolveFeatures(tier: string, raw: Record<string, unknown>): TenantFeatures {
  const base = TIER_FALLBACK[tier] ?? TIER_FALLBACK.STARTER;
  const bool = (k: keyof TenantFeatures) =>
    typeof raw[k] === "boolean" ? (raw[k] as boolean) : (base[k] as boolean);
  return {
    blog: bool("blog"),
    catalog: bool("catalog"),
    checkout: bool("checkout"),
    customerAccounts: bool("customerAccounts"),
    subscriptions: bool("subscriptions"),
    discountCodes: bool("discountCodes"),
    reviews: bool("reviews"),
    gifts: bool("gifts"),
    customDomain: bool("customDomain"),
    maxProducts:
      typeof raw.maxProducts === "number" ? raw.maxProducts : base.maxProducts,
  };
}

export function mapTenant(t: ApiTenant): Tenant {
  const features = t.features ?? {};
  const tier = (t.tier as Tenant["tier"]) ?? "STARTER";
  const num = (k: string, fallback: number) =>
    typeof features[k] === "number" ? (features[k] as number) : fallback;
  return {
    slug: t.slug,
    name: t.name,
    brand: t.name,
    tagline: "Tostadores de café de especialidad",
    tier,
    features: resolveFeatures(tier, features),
    // These may move into the API settings endpoint later; sensible defaults
    // matching the seeded tenant for now.
    freeShippingThresholdCents: num("freeShippingThresholdCents", 150_000_00),
    subscriptionDiscountPct: num("subscriptionDiscountPct", 10),
    currency: "COP",
    paymentProvider: (t.paymentProvider as Tenant["paymentProvider"]) ?? null,
    mpPublicKey: t.mpPublicKey ?? null,
  };
}

export function mapAnnouncements(arr: ApiAnnouncement[]): AnnounceMessage[] {
  return (arr ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((a) => ({ id: a.id, text: a.data.text, href: a.data.cta?.href }));
}

export function mapHero(h: ApiHeroBlock): HeroContent {
  return {
    eyebrow: "Café de especialidad",
    title: h.data.title,
    subtitle: h.data.subtitle,
    ctaPrimaryLabel: h.data.cta?.label ?? "Comprar",
    ctaPrimaryHref: h.data.cta?.href ?? "/catalogo",
    ctaSecondaryLabel: "Ver suscripción",
    ctaSecondaryHref: "/suscripciones",
    imageAlt: h.data.title,
  };
}

// Cheapest one-time price across a product's variants — used to build
// spotlight / featured-pack price tags.
export function cheapestPriceCents(p: Product): number {
  if (p.variants.length === 0) return 0;
  return p.variants.reduce(
    (min, v) => Math.min(min, v.priceOneTimeCents),
    p.variants[0].priceOneTimeCents,
  );
}
