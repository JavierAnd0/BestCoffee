export interface BlogPost {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  body: string[];
  publishedAt: string; // "04 jun 2026"
  readMinutes: number;
  author: { name: string; role: string };
  tags: string[];
  pullQuote?: string;
  featured?: boolean;
}

export const BLOG_CATEGORIES = [
  "Todos",
  "Origen",
  "Barismo",
  "Recetas",
  "Historias",
  "Sostenibilidad",
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "el-viaje-de-un-grano-huila",
    category: "Historias",
    title: "El viaje de un grano: de Huila a tu taza",
    excerpt:
      "Un recorrido por la finca La Esperanza, los caminos veredales y el tostado en lotes pequeños que hace posible la taza que tienes hoy en frente.",
    body: [
      "Cada bolsa que sale de nuestra tostadora cuenta una historia que empezó meses antes en la finca. Acompañamos a Don Hernán durante una jornada de cosecha y vimos cómo la selección manual define la calidad de la taza.",
      "El proceso lavado es el más común en Huila porque preserva la acidez brillante característica de la región. Cada cereza pasa por despulpado, fermentación y secado en marquesinas elevadas que toman entre 12 y 18 días según el clima.",
      "Cuando el café llega al puerto y luego a nuestra tostadora en Bogotá, lo recibimos como pergamino verde. Nuestro tostador maestro hace pruebas pequeñas durante una semana hasta encontrar el perfil que más resalta las notas naturales del lote.",
    ],
    publishedAt: "04 jun 2026",
    readMinutes: 8,
    author: { name: "María Restrepo", role: "Editora de origen" },
    tags: ["huila", "origen único", "productores", "lavado"],
    pullQuote: "El café cambia de manos muchas veces antes de llegar a la tuya.",
    featured: true,
  },
  {
    slug: "guia-pour-over-cinco-pasos",
    category: "Barismo",
    title: "Guía del pour over en 5 pasos",
    excerpt:
      "El método V60 es uno de los más accesibles y revela el carácter de un origen único como ningún otro.",
    body: [
      "Para un pour over balanceado usa 15 g de café molido medio-fino y 250 g de agua a 93°C.",
      "Pesa y empieza con un bloom de 40 g durante 30 segundos. Después haz vertidos circulares hasta llegar a los 250 g totales.",
      "El tiempo total debe estar entre 2:30 y 3:00 minutos. Si pasa más, muele un poco más grueso la próxima vez.",
    ],
    publishedAt: "02 jun 2026",
    readMinutes: 5,
    author: { name: "Carlos Niño", role: "Barista" },
    tags: ["pour over", "v60", "barismo"],
  },
  {
    slug: "cold-brew-naranja-verano",
    category: "Recetas",
    title: "Cold brew de naranja para el verano",
    excerpt:
      "Una versión refrescante del clásico cold brew con cáscaras de naranja y un toque de cardamomo.",
    body: [
      "Mezcla 100 g de café molido grueso con 1 litro de agua filtrada fría. Agrega cáscaras de una naranja y 2 vainas de cardamomo machacadas.",
      "Deja reposar en la nevera durante 14 horas. Filtra con papel y sirve sobre hielo con una rodaja de naranja fresca.",
    ],
    publishedAt: "29 may 2026",
    readMinutes: 4,
    author: { name: "Sofía Pérez", role: "Recetas" },
    tags: ["cold brew", "recetas", "verano"],
  },
  {
    slug: "lavado-vs-natural",
    category: "Origen",
    title: "Qué significa 'lavado' vs 'natural'",
    excerpt:
      "Los procesos de beneficio cambian radicalmente el perfil de taza. Te explicamos las diferencias en lenguaje simple.",
    body: [
      "En el proceso lavado, la cereza se despulpa y luego fermenta en agua. El resultado: tazas más limpias, brillantes y de acidez definida.",
      "En el proceso natural, la cereza se seca entera al sol. El mucílago aporta dulzor y notas a frutas maduras o vino.",
    ],
    publishedAt: "25 may 2026",
    readMinutes: 7,
    author: { name: "María Restrepo", role: "Editora de origen" },
    tags: ["origen", "procesamiento"],
  },
  {
    slug: "comercio-justo-explicado",
    category: "Sostenibilidad",
    title: "Comercio justo, explicado simple",
    excerpt:
      "Más allá del sello: qué implica realmente comprar café con relación directa con productores.",
    body: [
      "Comercio justo es un sistema de certificación que garantiza un precio mínimo al productor.",
      "En nuestra cadena vamos más allá: trabajamos con relación directa, lo que significa pagar entre 30 y 80% por encima del precio C de bolsa según el lote.",
    ],
    publishedAt: "21 may 2026",
    readMinutes: 6,
    author: { name: "Andrés Vargas", role: "Director" },
    tags: ["sostenibilidad", "comercio justo"],
  },
  {
    slug: "por-que-muelo-justo-antes",
    category: "Barismo",
    title: "Por qué muelo justo antes de preparar",
    excerpt:
      "El café molido pierde aromas a los pocos minutos. Te explicamos por qué un molino vale la pena.",
    body: [
      "Cuando muelas el café, expones más superficie al oxígeno y los aromas volátiles se evaporan rápido.",
      "Un molino de buena calidad (de fresas, no de cuchillas) hace una molienda uniforme que permite una extracción pareja.",
    ],
    publishedAt: "18 may 2026",
    readMinutes: 5,
    author: { name: "Carlos Niño", role: "Barista" },
    tags: ["molienda", "molino", "barismo"],
  },
];

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function featuredPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
}
