// Domain types — mirror future API (NestJS + Prisma) so swapping mock
// to live data is purely a fetch swap.

export type ProductType = "BLEND" | "SINGLE_ORIGIN" | "DECAF" | "ACCESSORY";
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
  // Free-form strings from the API (e.g. "Comercio justo", "Nuevo"). Known
  // enum values get nicer labels in the UI; unknown ones render verbatim.
  badges: string[];
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

export interface TenantFeatures {
  blog: boolean;
  catalog: boolean;
  /** Pedidos: carrito y creación de la orden. */
  checkout: boolean;
  /** Cobro en línea. Con `checkout` y sin esto: pedidos con pago por fuera. */
  onlinePayments: boolean;
  customerAccounts: boolean;
  subscriptions: boolean;
  discountCodes: boolean;
  reviews: boolean;
  gifts: boolean;
  customDomain: boolean;
  /** Plan de tueste, clientes en riesgo y exportación (BUSINESS). */
  advancedAnalytics: boolean;
  accessories: boolean;
  maxProducts: number;
}

/** Invitación a suscribirse al boletín (configurable por tienda). */
export interface TenantNewsletter {
  /** Mostrar la invitación discreta a visitantes sin sesión. */
  popupEnabled: boolean;
  /** Oferta de bienvenida vigente (cupón real validado por el backend), si hay. */
  welcomeOffer: { code: string; label: string } | null;
}

/** Páginas editoriales con contenido propio de cada marca. */
export type EditorialPage = "historia" | "impacto" | "sostenibilidad" | "mayoristas" | "tiendas";

/**
 * Identidad de la tienda. Sale de `Tenant.branding` (JSON editable desde el
 * superadmin). Todo es opcional: sin dato se usa un valor neutro, nunca el de
 * otra marca.
 */
export interface TenantBranding {
  /** Color de acento (hex). Sin dato, el del tema base. */
  accent: string | null;
  /** Imagen del logo. Sin dato, el nombre de la tienda en texto. */
  logoUrl: string | null;
  /** Hero del inicio: escena 3D (propia de la demo) o clásico de texto. */
  hero: "scene3d" | "classic";
  contactEmail: string | null;
  contactPhone: string | null;
  /** Razón social y NIT para factura y textos legales. */
  legalName: string | null;
  legalId: string | null;
  city: string | null;
  /** Qué páginas editoriales tiene esta tienda (su contenido es de cada marca). */
  pages: Record<EditorialPage, boolean>;
}

export interface Tenant {
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  branding: TenantBranding;
  /** Suspendida por cobro (cancelada o inactiva): el sitio no se muestra ni vende. */
  suspended: boolean;
  /** Tienda de demostración: muestra el panel para encender y apagar funciones. */
  demo: boolean;
  tier: "STARTER" | "PRO" | "BUSINESS";
  features: TenantFeatures;
  newsletter: TenantNewsletter;
  freeShippingThresholdCents: number;
  /** Tarifa plana de envío cuando no se alcanza el umbral (centavos). */
  shippingFlatCents: number;
  subscriptionDiscountPct: number;
  currency: "COP";
  paymentProvider?: "mercadopago" | null;
  mpPublicKey?: string | null;
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
