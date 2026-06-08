export interface StoreLocation {
  slug: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    slug: "chapinero",
    name: "ORÍGEN Chapinero",
    address: "Cra 13 #57-32",
    city: "Bogotá",
    hours: "Lun–Dom · 7:00–20:00",
    phone: "+57 1 234 5678",
  },
  {
    slug: "usaquen",
    name: "ORÍGEN Usaquén",
    address: "Cl 119 #6-15",
    city: "Bogotá",
    hours: "Mar–Dom · 8:00–19:00",
    phone: "+57 1 345 6789",
  },
  {
    slug: "candelaria",
    name: "ORÍGEN La Candelaria",
    address: "Cl 11 #4-29",
    city: "Bogotá",
    hours: "Lun–Sáb · 8:00–18:00",
    phone: "+57 1 456 7890",
  },
];

export interface BrewGuide {
  slug: string;
  method: string;
  summary: string;
  totalTime: string;
  difficulty: "Fácil" | "Media" | "Avanzada";
  steps: { title: string; body: string; durationSec: number }[];
}

export const BREW_GUIDES: BrewGuide[] = [
  {
    slug: "v60",
    method: "Pour over · V60",
    summary: "El método más versátil para descubrir notas frutales y florales.",
    totalTime: "3 min",
    difficulty: "Media",
    steps: [
      { title: "Calienta y enjuaga", body: "Hierve 300 g de agua a 93°C. Enjuaga el filtro de papel.", durationSec: 30 },
      { title: "Pesa y muele", body: "15 g de café molido medio-fino, como sal de mesa.", durationSec: 30 },
      { title: "Bloom", body: "Vierte 40 g de agua, espera 30 segundos. El café crece.", durationSec: 30 },
      { title: "Vertidos", body: "Vertidos circulares hasta llegar a 250 g totales.", durationSec: 90 },
      { title: "Sirve", body: "El goteo termina en ~2:45. Sirve y disfruta.", durationSec: 15 },
    ],
  },
  {
    slug: "prensa-francesa",
    method: "Prensa francesa",
    summary: "Cuerpo redondo y rico. Perfecta para tuestes medios y oscuros.",
    totalTime: "5 min",
    difficulty: "Fácil",
    steps: [
      { title: "Pesa", body: "30 g de café molido grueso por cada 500 ml de agua.", durationSec: 30 },
      { title: "Vierte", body: "Agua a 92°C. Mezcla y deja reposar 4 minutos.", durationSec: 240 },
      { title: "Presiona y sirve", body: "Baja el émbolo lentamente y sirve.", durationSec: 30 },
    ],
  },
  {
    slug: "aeropress",
    method: "AeroPress",
    summary: "Rápida, limpia y muy perdonadora. Para llevar a cualquier parte.",
    totalTime: "2 min",
    difficulty: "Fácil",
    steps: [
      { title: "Arma invertida", body: "AeroPress invertida, filtro mojado en la tapa.", durationSec: 20 },
      { title: "Pesa", body: "15 g de café molido fino, 220 g de agua a 85°C.", durationSec: 20 },
      { title: "Mezcla", body: "Revuelve 10 segundos y espera 1 minuto.", durationSec: 70 },
      { title: "Invierte y prensa", body: "Coloca la tapa, invierte sobre la taza y presiona.", durationSec: 30 },
    ],
  },
  {
    slug: "espresso",
    method: "Espresso",
    summary: "Intenso y concentrado. La base de cualquier bebida con leche.",
    totalTime: "30 s",
    difficulty: "Avanzada",
    steps: [
      { title: "Dosifica", body: "18 g de café molido fino en portafiltro doble.", durationSec: 15 },
      { title: "Nivela y tampea", body: "Distribuye y tampea con presión uniforme.", durationSec: 15 },
      { title: "Extrae", body: "30 ml en 25–30 segundos. Ajusta molienda según resultado.", durationSec: 30 },
    ],
  },
  {
    slug: "cold-brew",
    method: "Cold brew",
    summary: "Suave, dulce, sin acidez. Ideal para climas cálidos.",
    totalTime: "14 h",
    difficulty: "Fácil",
    steps: [
      { title: "Mezcla", body: "100 g de café molido grueso + 1 litro de agua fría.", durationSec: 60 },
      { title: "Reposa", body: "14 horas en la nevera.", durationSec: 50400 },
      { title: "Filtra", body: "Cuela con filtro de papel y sirve sobre hielo.", durationSec: 60 },
    ],
  },
];

export function findGuide(slug: string): BrewGuide | undefined {
  return BREW_GUIDES.find((g) => g.slug === slug);
}
