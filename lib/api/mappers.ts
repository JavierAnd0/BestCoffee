// Maps backend (NestJS) response shapes to the front's domain types.
// The API and the front were designed independently, so a thin adapter keeps
// component code stable regardless of small naming differences.

import type {
  Product,
  Tenant,
  TenantFeatures,
  AnnounceMessage,
  HeroContent,
  EditorialPage,
  TenantBranding,
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
  branding?: Record<string, unknown> | null;
  suspended?: boolean;
  demo?: boolean;
  paymentProvider?: string | null;
  mpPublicKey?: string | null;
  epaycoConnected?: boolean;
  newsletter?: {
    popupEnabled?: boolean;
    welcomeOffer?: { code?: string; label?: string } | null;
  };
  /** Regla de envío real de la tienda (la misma que aplica el carrito). */
  shipping?: { freeShippingThresholdCents?: number; shippingFlatCents?: number };
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

// Las capacidades las resuelve el backend (GET /v1/tenants/current las manda ya
// calculadas: tier + overrides). Aquí no hay copia de la tabla por tier. Si una
// clave no llega, se asume lo mínimo —solo presencia—: nunca se abre una
// función de pago por un dato ausente.
const MINIMAL_FEATURES: TenantFeatures = {
  blog: true,
  catalog: true,
  accessories: true,
  checkout: false,
  onlinePayments: false,
  customerAccounts: false,
  subscriptions: false,
  discountCodes: false,
  reviews: false,
  gifts: false,
  customDomain: false,
  advancedAnalytics: false,
  maxProducts: 10,
};

function resolveFeatures(raw: Record<string, unknown>): TenantFeatures {
  const out = { ...MINIMAL_FEATURES };
  for (const key of Object.keys(MINIMAL_FEATURES) as (keyof TenantFeatures)[]) {
    const value = raw[key];
    if (typeof value === typeof MINIMAL_FEATURES[key]) {
      (out[key] as boolean | number) = value as boolean | number;
    }
  }
  return out;
}

// La tienda demo es la dueña del contenido editorial y de la escena 3D que
// viven en este repo. Para cualquier otra tienda esos valores van apagados
// salvo que su `branding` los active: nunca se muestra la historia, las sedes
// o el hero de otra marca.
const DEMO_SLUG = "origen";
const EDITORIAL_PAGES: EditorialPage[] = [
  "historia",
  "impacto",
  "sostenibilidad",
  "mayoristas",
  "tiendas",
];

const text = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;
/** Solo colores hex: el valor termina en una variable CSS. */
const hexColor = (v: unknown): string | null =>
  typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : null;
/** Solo https o rutas locales (nunca `//host`): el valor termina en un `src`. */
const imageUrl = (v: unknown): string | null =>
  typeof v === "string" && /^(https:\/\/|\/(?!\/))[^\s"'<>]+$/.test(v.trim()) ? v.trim() : null;

export function mapBranding(slug: string, raw: Record<string, unknown> | null | undefined): TenantBranding {
  const b = raw ?? {};
  const isDemo = slug === DEMO_SLUG;
  const pagesRaw = (b.pages && typeof b.pages === "object" ? b.pages : {}) as Record<string, unknown>;
  const pages = Object.fromEntries(
    EDITORIAL_PAGES.map((p) => [p, typeof pagesRaw[p] === "boolean" ? (pagesRaw[p] as boolean) : isDemo]),
  ) as Record<EditorialPage, boolean>;
  return {
    accent: hexColor(b.accent),
    logoUrl: imageUrl(b.logoUrl),
    hero: b.hero === "scene3d" || b.hero === "classic" ? b.hero : isDemo ? "scene3d" : "classic",
    contactEmail: text(b.contactEmail),
    contactPhone: text(b.contactPhone),
    legalName: text(b.legalName),
    legalId: text(b.legalId),
    city: text(b.city),
    pages,
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
    tagline: text(t.branding?.tagline) ?? "Tostadores de café de especialidad",
    branding: mapBranding(t.slug, t.branding),
    suspended: t.suspended === true,
    demo: t.demo === true,
    tier,
    features: resolveFeatures(features),
    newsletter: {
      popupEnabled: t.newsletter?.popupEnabled ?? true,
      welcomeOffer:
        t.newsletter?.welcomeOffer?.code && t.newsletter.welcomeOffer.label
          ? {
              code: t.newsletter.welcomeOffer.code,
              label: t.newsletter.welcomeOffer.label,
            }
          : null,
    },
    // Envío: la API manda la regla que aplica el carrito; los valores por
    // defecto son los mismos de la API, solo para una API antigua sin `shipping`.
    freeShippingThresholdCents:
      typeof t.shipping?.freeShippingThresholdCents === "number"
        ? t.shipping.freeShippingThresholdCents
        : num("freeShippingThresholdCents", 150_000_00),
    shippingFlatCents:
      typeof t.shipping?.shippingFlatCents === "number"
        ? t.shipping.shippingFlatCents
        : num("shippingFlatCents", 12_000_00),
    subscriptionDiscountPct: num("subscriptionDiscountPct", 10),
    currency: "COP",
    // El backend manda el enum en mayúsculas ("MERCADOPAGO"); aquí se compara en
    // minúsculas. Sin normalizar, los campos de MercadoPago nunca aparecían.
    paymentProvider: normalizeProvider(t.paymentProvider),
    mpPublicKey: t.mpPublicKey ?? null,
    epaycoConnected: t.epaycoConnected === true,
  };
}

function normalizeProvider(raw?: string | null): "mercadopago" | "epayco" | null {
  const p = raw?.toLowerCase();
  return p === "mercadopago" || p === "epayco" ? p : null;
}

export function mapAnnouncements(arr: ApiAnnouncement[]): AnnounceMessage[] {
  return (arr ?? [])
    .filter((a) => Boolean(a?.data?.text))
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
