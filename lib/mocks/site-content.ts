import type {
  AnnounceMessage,
  HeroContent,
  SpotlightContent,
  FeaturedPackContent,
} from "../types";

export const ANNOUNCE_MESSAGES: AnnounceMessage[] = [
  { id: "a1", text: "Envío gratis en pedidos +$45.000 · suscríbete y ahorra 15%" },
  { id: "a2", text: "Llegó la cosecha de Etiopía Guji · cantidades limitadas" },
  { id: "a3", text: "Tostado bajo pedido · enviado fresco cada semana" },
];

export const HERO_HOME: HeroContent = {
  eyebrow: "Campaña de otoño",
  title: "El otoño sabe a café recién tostado",
  subtitle:
    "Mezclas y orígenes únicos, tostados en lotes pequeños en Bogotá y enviados frescos a tu puerta.",
  ctaPrimaryLabel: "Comprar la mezcla",
  ctaPrimaryHref: "/p/mezcla-del-alba",
  ctaSecondaryLabel: "Ver suscripción",
  ctaSecondaryHref: "/p/mezcla-del-alba?modo=suscripcion",
  imageAlt: "Bolsas de café recién tostadas sobre mesa de madera",
};

export const SPOTLIGHT_HOME: SpotlightContent = {
  eyebrow: "Origen único · spotlight",
  title: "Finca La Esperanza, Huila",
  body: "Don Hernán Ríos cultiva variedades Castillo y Caturra a 1.780 m en San Agustín. Su lote de esta cosecha tiene notas de frutas rojas, panela y un cierre cítrico.",
  roastLevel: 4,
  flavorNotes: ["frutas rojas", "panela", "cítrico"],
  priceCents: 74_000_00,
  productSlug: "finca-la-esperanza-huila",
  imageAlt: "Retrato del productor de la finca La Esperanza",
};

export const FEATURED_PACK_HOME: FeaturedPackContent = {
  eyebrow: "Paquete destacado",
  title: "Trío del trotamundos",
  description:
    "Tres bolsas de 340 g: una mezcla insignia y dos orígenes únicos rotativos cada mes.",
  priceCents: 148_000_00,
  bagsCount: 3,
  savingsPct: 12,
  productSlug: "trio-trotamundos",
};
