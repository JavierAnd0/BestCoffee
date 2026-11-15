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
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "Bolsa Mezcla del alba" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
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
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "Etiopía Guji" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
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
    images: [
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "Hairbender" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
    ],
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
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "Holler Mountain" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
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
    images: [
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "Finca La Esperanza" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
    ],
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
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "Decaf Trapper" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
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
  {
    id: "p_sierra",
    slug: "sierra-nevada",
    name: "Sierra Nevada",
    type: "SINGLE_ORIGIN",
    origin: "Sierra Nevada de Santa Marta",
    shortDescription:
      "Café cultivado en montaña costera, con notas achocolatadas y cuerpo cremoso.",
    longDescription:
      "Origen único de la Sierra Nevada de Santa Marta. Café orgánico cultivado bajo sombra por familias indígenas de la región.",
    roastLevel: 4,
    flavorNotes: ["chocolate negro", "panela", "avellana"],
    badges: ["ORIGEN ÚNICO"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "Bolsa Sierra Nevada" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_sierra_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(65_000),
        priceSubscriptionCents: price(55_250),
        stock: 35,
      },
      {
        id: "v_sierra_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(65_000),
        priceSubscriptionCents: price(55_250),
        stock: 25,
      },
    ],
    collectionSlugs: ["origenes", "bestsellers"],
  },
  {
    id: "p_gesha_cubillos",
    slug: "gesha-juan-cubillos",
    name: "LOT61 Colombia Gesha · Juan Cubillos",
    type: "SINGLE_ORIGIN",
    origin: "Huila / Nariño, Colombia",
    producerStory:
      "Cosechado por Juan Cubillos a 1.950 msnm. Variedad Gesha con proceso de beneficio lavado estricto que exalta notas florales complejas.",
    shortDescription:
      "Microlote exclusivo de Gesha en presentación 100g con rueda de notas sensoriales.",
    longDescription:
      "Una de las variedades más codiciadas del mundo. Notas extraordinarias a flor de saúco, durazno maduro y té blanco. Un perfil limpio, sedoso y brillante perfecto para métodos de vertido como V60 o Kalita.",
    roastLevel: 3,
    flavorNotes: ["flor de saúco", "durazno", "té blanco", "jazmín"],
    badges: ["LIMITED", "NEW"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "LOT61 Colombia Gesha Juan Cubillos" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_gesha_100_grain",
        sizeGrams: 100,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(54_000),
        priceSubscriptionCents: price(45_900),
        stock: 20,
      },
      {
        id: "v_gesha_100_filter",
        sizeGrams: 100,
        grind: "FILTER",
        priceOneTimeCents: price(54_000),
        priceSubscriptionCents: price(45_900),
        stock: 15,
      },
    ],
    collectionSlugs: ["origenes", "limitados", "bestsellers"],
  },
  {
    id: "p_fresh_water_decaf",
    slug: "lot61-fresh-water",
    name: "LOT61 Fresh Water Decaf",
    type: "DECAF",
    origin: "Single Origin · Colombia",
    producerStory:
      "Descafeinado con proceso natural al agua de montaña (Mountain Water Process) que conserva íntegros los azúcares naturales del grano sin rastros de solventes químicos.",
    shortDescription:
      "Descafeinado de origen único con notas a chocolate, frutos del bosque y vainilla.",
    longDescription:
      "Formulado para brindar el máximo cuerpo y dulzura tanto en espresso como en preparaciones de filtro. Disfruta una taza reconfortante a cualquier hora sin perder el perfil de un café de especialidad.",
    roastLevel: 4,
    flavorNotes: ["chocolate", "frutos del bosque", "panela", "vainilla"],
    badges: ["BESTSELLER"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "LOT61 Fresh Water Decaf" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_fw_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(68_000),
        priceSubscriptionCents: price(57_800),
        stock: 30,
      },
      {
        id: "v_fw_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(68_000),
        priceSubscriptionCents: price(57_800),
        stock: 22,
      },
    ],
    collectionSlugs: ["descafeinados", "bestsellers"],
  },
  {
    id: "p_narino_galeras",
    slug: "narino-galeras",
    name: "Nariño Volcán Galeras",
    type: "SINGLE_ORIGIN",
    origin: "La Florida, Nariño (2.050 m)",
    producerStory:
      "Cultivado en las faldas volcánicas ricas en minerales. Cosechas de recolección selectiva manual.",
    shortDescription:
      "Acidez cítrica brillante y notas de mandarina, miel silvestre y caramelo.",
    longDescription:
      "Las grandes altitudes de Nariño permiten una maduración lenta de la cereza, concentrando azúcares y aportando una acidez jugosa y elegante en taza.",
    roastLevel: 3,
    flavorNotes: ["mandarina", "miel silvestre", "caramelo"],
    badges: ["ORIGEN ÚNICO"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "Nariño Volcán Galeras" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_ng_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(69_000),
        priceSubscriptionCents: price(58_650),
        stock: 18,
      },
      {
        id: "v_ng_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(69_000),
        priceSubscriptionCents: price(58_650),
        stock: 14,
      },
    ],
    collectionSlugs: ["origenes"],
  },
  {
    id: "p_tolima_san_antonio",
    slug: "tolima-san-antonio",
    name: "Tolima San Antonio Caturra",
    type: "SINGLE_ORIGIN",
    origin: "San Antonio, Tolima (1.820 m)",
    producerStory:
      "Producido por la asociación de caficultores de San Antonio con fermentación controlada de 24 horas.",
    shortDescription:
      "Cosecha de altura con notas a manzana roja, limoncillo y miel de caña.",
    longDescription:
      "Un café balanceado con dulzura marcada de panela, retrogusto refrescante a limoncillo y cuerpo medio sedoso.",
    roastLevel: 4,
    flavorNotes: ["manzana roja", "limoncillo", "miel de caña"],
    badges: ["SEASONAL"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-1.jpg", alt: "Tolima San Antonio Caturra" },
      { id: "i2", url: "/img/products/catalogo-2.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_tolima_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(66_000),
        priceSubscriptionCents: price(56_100),
        stock: 25,
      },
      {
        id: "v_tolima_340_filter",
        sizeGrams: 340,
        grind: "FILTER",
        priceOneTimeCents: price(66_000),
        priceSubscriptionCents: price(56_100),
        stock: 19,
      },
    ],
    collectionSlugs: ["origenes"],
  },
  {
    id: "p_espresso_reserva",
    slug: "espresso-reserva",
    name: "Espresso Reserva Especial",
    type: "BLEND",
    shortDescription:
      "Mezcla de tueste medio balanceada con notas a cacao amargo, almendra y avellana.",
    longDescription:
      "Diseñada especialmente para máquinas de espresso y cafeteras italianas (moka). Produce una crema densa y dorada con notas persistentes de chocolate y frutos secos.",
    roastLevel: 5,
    flavorNotes: ["cacao amargo", "almendra tostada", "avellana"],
    badges: ["BESTSELLER"],
    status: "ACTIVE",
    subscriptionAvailability: "YES",
    images: [
      { id: "i1", url: "/img/products/catalogo-2.jpg", alt: "Espresso Reserva Especial" },
      { id: "i2", url: "/img/products/catalogo-1.jpg", alt: "Detalle empaque de café" },
    ],
    variants: [
      {
        id: "v_reserva_340_grain",
        sizeGrams: 340,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(59_000),
        priceSubscriptionCents: price(50_150),
        stock: 32,
      },
      {
        id: "v_reserva_340_espresso",
        sizeGrams: 340,
        grind: "ESPRESSO",
        priceOneTimeCents: price(59_000),
        priceSubscriptionCents: price(50_150),
        stock: 28,
      },
      {
        id: "v_reserva_1k_grain",
        sizeGrams: 1000,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(158_000),
        priceSubscriptionCents: price(134_300),
        stock: 15,
      },
    ],
    collectionSlugs: ["mezclas", "bestsellers"],
  },
  {
    id: "p_molino_precision",
    slug: "molino-manual-precision",
    name: "Molino Manual Conical Burr",
    type: "ACCESSORY",
    origin: "Equipo de precisión",
    shortDescription:
      "Fresas cónicas de acero inoxidable de 40 mm, cuerpo de aluminio mecanizado y 36 clics de ajuste fino para espresso y filtro.",
    longDescription:
      "Diseñado para los entusiastas del café que buscan una molienda perfectamente homogénea en casa o de viaje. Su doble rodamiento estabiliza el eje central eliminando la fricción y el polvo excesivo.",
    roastLevel: 0,
    flavorNotes: ["Acero inox 40mm", "36 clics de ajuste", "Cuerpo aluminio"],
    badges: ["DESTACADO"],
    status: "ACTIVE",
    subscriptionAvailability: "NO",
    images: [{ id: "acc_1", url: "/img/products/molino-1.jpg", alt: "Molino manual de café" }],
    variants: [
      {
        id: "v_molino_negro",
        sizeGrams: 450,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(280_000),
        priceSubscriptionCents: null,
        stock: 15,
      },
    ],
    collectionSlugs: ["accesorios", "molinos", "bestsellers"],
  },
  {
    id: "p_tetera_cisne",
    slug: "tetera-cuello-cisne",
    name: "Tetera Cuello de Cisne Gooseneck",
    type: "ACCESSORY",
    origin: "Vertido de precisión",
    shortDescription:
      "Acero inoxidable 304 con pico de precisión para flujo de agua constante y termómetro análogo integrado en la tapa.",
    longDescription:
      "Control absoluto de la tasa de vertido y turbulencia en tus preparaciones de V60, Chemex o Kalita. El termómetro incorporado te permite verter exactamente en la temperatura óptima de extracción (90°–93°C).",
    roastLevel: 0,
    flavorNotes: ["1.0 Litro", "Acero 304", "Termómetro integrado"],
    badges: ["BARISMO"],
    status: "ACTIVE",
    subscriptionAvailability: "NO",
    images: [{ id: "acc_2", url: "/img/products/tetera-1.jpg", alt: "Tetera cuello de cisne" }],
    variants: [
      {
        id: "v_tetera_acero",
        sizeGrams: 550,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(165_000),
        priceSubscriptionCents: null,
        stock: 20,
      },
    ],
    collectionSlugs: ["accesorios", "teteras"],
  },
  {
    id: "p_taza_ceramica",
    slug: "taza-ceramica-artesanal",
    name: "Taza Cerámica Artesanal 250 ml",
    type: "ACCESSORY",
    origin: "Artesanal · Colombia",
    shortDescription:
      "Cerámica gres esmaltada a mano por ceramistas locales. Retención térmica superior y borde redondeado para resaltar la crema.",
    longDescription:
      "Moldeada a torno y horneada a 1.240°C para una durabilidad excepcional. Su diseño orgánico se adapta cómodamente a las manos, ideal para capuchino, flat white o tu taza matutina de café filtrado.",
    roastLevel: 0,
    flavorNotes: ["250 ml", "Cerámica gres", "Hecha a mano"],
    badges: ["ARTESANAL"],
    status: "ACTIVE",
    subscriptionAvailability: "NO",
    images: [{ id: "acc_3", url: "/img/products/taza-1.jpg", alt: "Taza de café cerámica" }],
    variants: [
      {
        id: "v_taza_gres",
        sizeGrams: 280,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(42_000),
        priceSubscriptionCents: null,
        stock: 40,
      },
    ],
    collectionSlugs: ["accesorios", "tazas"],
  },
  {
    id: "p_gotero_v60",
    slug: "gotero-ceramico-v60",
    name: "Gotero Cerámico V60 de Extracción",
    type: "ACCESSORY",
    origin: "Métodos manuales",
    shortDescription:
      "Cono estriado en espiral para una extracción limpia y resaltado de notas florales y frutales.",
    longDescription:
      "El método favorito de baristas profesionales alrededor del mundo. Su ángulo de 60 grados y orificio central amplio te dan el control total de la velocidad del flujo de extracción.",
    roastLevel: 0,
    flavorNotes: ["Tamaño 02", "Cerámica esmaltada", "1-4 Tazas"],
    badges: ["MÉTODOS"],
    status: "ACTIVE",
    subscriptionAvailability: "NO",
    images: [{ id: "acc_4", url: "/img/products/v60-1.jpg", alt: "Gotero V60" }],
    variants: [
      {
        id: "v_v60_blanco",
        sizeGrams: 320,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(78_000),
        priceSubscriptionCents: null,
        stock: 25,
      },
    ],
    collectionSlugs: ["accesorios", "metodos"],
  },
  {
    id: "p_bascula_timer",
    slug: "bascula-digital-barista",
    name: "Báscula Digital con Temporizador",
    type: "ACCESSORY",
    origin: "Herramienta de precisión",
    shortDescription:
      "Precisión milimétrica de 0.1 g con cronómetro integrado para control exacto del ratio agua-café.",
    longDescription:
      "Báscula compacta con almohadilla de silicona antideslizante resistente al calor y pantalla LED retroiluminada de alta visibilidad. Batería recargable vía USB-C.",
    roastLevel: 0,
    flavorNotes: ["0.1 g precisión", "Cronómetro", "USB-C"],
    badges: ["PRECISIÓN"],
    status: "ACTIVE",
    subscriptionAvailability: "NO",
    images: [{ id: "acc_5", url: "/img/products/bascula-1.jpg", alt: "Báscula barista" }],
    variants: [
      {
        id: "v_bascula_led",
        sizeGrams: 300,
        grind: "WHOLE_BEAN",
        priceOneTimeCents: price(125_000),
        priceSubscriptionCents: null,
        stock: 18,
      },
    ],
    collectionSlugs: ["accesorios"],
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
