import type { Product } from "../types";

// Prices in COP centavos (1 unit = $0.01 COP).
function price(cop: number) {
  return cop * 100;
}

export const PRODUCTS: Product[] = [
  {
    id: "p_alba",
    slug: "mezcla-del-alba",
    name: "Mezcla del alba",
    type: "BLEND",
    shortDescription:
      "Mezcla insignia, equilibrada y dulce, pensada para empezar la mañana.",
    longDescription:
      "Mezcla equilibrada con notas de cacao y nuez tostada, perfecta como espresso o filtro de cada día. Origen rotativo de Huila y Nariño según la cosecha.",
    roastLevel: 5,
    flavorNotes: ["chocolate", "nuez", "miel de caña"],
    badges: ["BESTSELLER"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/alba-1.jpg", alt: "Bolsa Mezcla del alba" },
    ],
    variants: [
      {
        id: "v_alba_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(58_000),
        priceSubscriptionCents: price(49_300),
        stock: 42,
      },
      {
        id: "v_alba_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(58_000),
        priceSubscriptionCents: price(49_300),
        stock: 30,
      },
      {
        id: "v_alba_1k_grain",
        sizeGrams: 1000,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(155_000),
        priceSubscriptionCents: price(131_750),
        stock: 18,
      },
    ],
    collectionSlugs: ["bestsellers", "mezclas"],
  },
  {
    id: "p_etiopia_guji",
    slug: "etiopia-guji",
    name: "Etiopía Guji",
    type: "SINGLE_ORIGIN",
    origin: "Guji, Etiopía",
    producerStory:
      "Cosecha de la cooperativa Banko Dhadhato, en la región de Guji a 1.950 m. Proceso lavado.",
    shortDescription: "Origen único etíope, floral y luminoso.",
    longDescription:
      "Notas de jazmín, durazno y té negro. Cuerpo ligero, acidez cítrica brillante. Ideal en V60 o Chemex.",
    roastLevel: 3,
    flavorNotes: ["jazmín", "durazno", "cítrico", "té negro"],
    badges: ["NEW"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [{ id: "i1", url: "/img/products/guji-1.jpg", alt: "Etiopía Guji" }],
    variants: [
      {
        id: "v_guji_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(72_000),
        priceSubscriptionCents: price(61_200),
        stock: 24,
      },
      {
        id: "v_guji_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(72_000),
        priceSubscriptionCents: price(61_200),
        stock: 16,
      },
    ],
    collectionSlugs: ["bestsellers", "origenes"],
  },
  {
    id: "p_hairbender",
    slug: "hairbender",
    name: "Hairbender",
    type: "BLEND",
    shortDescription: "Mezcla de espresso intensa, dulce y achocolatada.",
    longDescription:
      "Diseñada para espresso con leche y americano. Notas de caramelo, cereza y chocolate negro.",
    roastLevel: 6,
    flavorNotes: ["caramelo", "cereza", "chocolate negro"],
    badges: [],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [{ id: "i1", url: "/img/products/hairbender-1.jpg", alt: "Hairbender" }],
    variants: [
      {
        id: "v_hb_340_espresso",
        sizeGrams: 340,
        grind: "ESPRESSO",
        priceOneTimeCents: price(62_000),
        priceSubscriptionCents: price(52_700),
        stock: 38,
      },
      {
        id: "v_hb_1k_espresso",
        sizeGrams: 1000,
        grind: "ESPRESSO",
        priceOneTimeCents: price(165_000),
        priceSubscriptionCents: price(140_250),
        stock: 12,
      },
    ],
    collectionSlugs: ["mezclas"],
  },
  {
    id: "p_holler",
    slug: "holler-mountain",
    name: "Holler Mountain",
    type: "BLEND",
    shortDescription: "Tueste oscuro, cuerpo robusto, cacao y melaza.",
    roastLevel: 7,
    flavorNotes: ["cacao", "melaza", "tabaco"],
    badges: [],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [{ id: "i1", url: "/img/products/holler-1.jpg", alt: "Holler Mountain" }],
    variants: [
      {
        id: "v_holler_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(60_000),
        priceSubscriptionCents: price(51_000),
        stock: 26,
      },
    ],
    collectionSlugs: ["mezclas", "tostados-oscuros"],
  },
  {
    id: "p_la_esperanza",
    slug: "finca-la-esperanza-huila",
    name: "Finca La Esperanza, Huila",
    type: "SINGLE_ORIGIN",
    origin: "Huila, Colombia",
    producerStory:
      "Don Hernán Ríos cultiva variedades Castillo y Caturra a 1.780 m en San Agustín, Huila.",
    shortDescription:
      "Origen único colombiano. Frutas rojas, panela y cierre cítrico.",
    longDescription:
      "Notas a frutas rojas, panela y cítrico fresco. Cuerpo medio, acidez vibrante. Filtro o aeropress.",
    roastLevel: 4,
    flavorNotes: ["frutas rojas", "panela", "cítrico"],
    badges: ["LIMITED"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [{ id: "i1", url: "/img/products/esperanza-1.jpg", alt: "Finca La Esperanza" }],
    variants: [
      {
        id: "v_esp_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(74_000),
        priceSubscriptionCents: price(62_900),
        stock: 14,
      },
      {
        id: "v_esp_250_filter",
        sizeGrams: 250,
        grind: "FILTER",
        priceOneTimeCents: price(58_000),
        priceSubscriptionCents: price(49_300),
        stock: 9,
      },
    ],
    collectionSlugs: ["origenes", "limitados"],
  },
  {
    id: "p_decaf",
    slug: "decaf-trapper",
    name: "Decaf Trapper",
    type: "DECAF",
    shortDescription: "Descafeinado en agua suiza, dulce y suave.",
    roastLevel: 5,
    flavorNotes: ["cacao", "nuez", "vainilla"],
    badges: [],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [{ id: "i1", url: "/img/products/decaf-1.jpg", alt: "Decaf Trapper" }],
    variants: [
      {
        id: "v_decaf_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(64_000),
        priceSubscriptionCents: price(54_400),
        stock: 22,
      },
    ],
    collectionSlugs: ["descafeinados"],
  },
];

export function findProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function productsByCollection(collection: string): Product[] {
  return PRODUCTS.filter((p) => p.collectionSlugs.includes(collection));
}

export function bestsellers(): Product[] {
  return productsByCollection("bestsellers");
}
