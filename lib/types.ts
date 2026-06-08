// Domain types — mirror future API (NestJS + Prisma) so swapping mock
// to live data is purely a fetch swap.

export type ProductType = "BLEND" | "SINGLE_ORIGIN" | "DECAF";
export type GrindFormat =
  | "WHOLE_BEAN"
  | "ESPRESSO"
  | "FILTER"
  | "FRENCH_PRESS";
export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type SubAvail = "YES" | "NO" | "SUBSCRIPTION_ONLY";
export type Badge =
  | "BESTSELLER"
  | "NEW"
  | "LIMITED"
  | "SUBSCRIBER_ONLY"
  | "SEASONAL";

export type FlavorNote = string;

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

export interface ProductVariant {
  id: string;
  sizeGrams: number;
  grind: GrindFormat;
  priceOneTimeCents: number;
  priceSubscriptionCents: number | null;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  origin?: string;
  producerStory?: string;
  shortDescription: string;
  longDescription?: string;
  roastLevel: number; // 1..9
  flavorNotes: FlavorNote[];
  badges: Badge[];
  status: ProductStatus;
  subscriptionAvailability: SubAvail;
  images: ProductImage[];
  variants: ProductVariant[];
  collectionSlugs: string[];
}

export interface Collection {
  slug: string;
  name: string;
  description?: string;
}

export interface Tenant {
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  freeShippingThresholdCents: number;
  subscriptionDiscountPct: number;
  currency: "COP";
}

export interface AnnounceMessage {
  id: string;
  text: string;
  href?: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle?: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  imageAlt: string;
}

export interface SpotlightContent {
  eyebrow: string;
  title: string;
  body: string;
  roastLevel: number;
  flavorNotes: FlavorNote[];
  priceCents: number;
  productSlug: string;
  imageAlt: string;
}

export interface FeaturedPackContent {
  eyebrow: string;
  title: string;
  description: string;
  priceCents: number;
  bagsCount: number;
  savingsPct: number;
  productSlug: string;
}

export interface Review {
  id: string;
  productSlug: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: string;
  verifiedSubscriber: boolean;
}
