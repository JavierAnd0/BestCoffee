export interface StoreLocation {
  slug: string;
  name: string;
  neighborhood: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  features: string[];
  description: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    slug: "chapinero",
    name: "ORÍGEN Chapinero",
    neighborhood: "Chapinero Alto",
    address: "Cra 13 #57-32",
    city: "Bogotá",
    hours: "Lun–Dom · 7:00–20:00",
    phone: "+57 (601) 234-5678",
    coordinates: {
      lat: 4.6443,
      lng: -74.0628,
    },
    features: [
      "Barra de filtrados",
      "Molienda personalizada",
      "Pet friendly",
      "WiFi de alta velocidad",
      "Terraza",
    ],
    description:
      "Nuestra tienda insignia en el corazón de Chapinero. Espacio de dos niveles con barra de métodos manuales (V60, Chemex, Aeropress), tueste visible y ambiente ideal para trabajar o disfrutar una buena taza.",
    googleMapsUrl: "https://www.google.com/maps/dir/?api=1&destination=4.6443,-74.0628",
    wazeUrl: "https://waze.com/ul?ll=4.6443,-74.0628&navigate=yes",
  },
  {
    slug: "usaquen",
    name: "ORÍGEN Usaquén",
    neighborhood: "Usaquén Colonial",
    address: "Cl 119 #6-15",
    city: "Bogotá",
    hours: "Mar–Dom · 8:00–19:00",
    phone: "+57 (601) 345-6789",
    coordinates: {
      lat: 4.6957,
      lng: -74.0312,
    },
    features: [
      "Casona colonial",
      "Jardín interior",
      "Barra Synesso",
      "Pet friendly",
      "Venta de accesorios",
    ],
    description:
      "Ubicada en una arquitectura colonial restaurada a pasos de la plaza de Usaquén. Un oasis de calma con jardín interior donde probar ediciones limitadas y maridajes de autor.",
    googleMapsUrl: "https://www.google.com/maps/dir/?api=1&destination=4.6957,-74.0312",
    wazeUrl: "https://waze.com/ul?ll=4.6957,-74.0312&navigate=yes",
  },
  {
    slug: "candelaria",
    name: "ORÍGEN La Candelaria",
    neighborhood: "Centro Histórico",
    address: "Cl 11 #4-29",
    city: "Bogotá",
    hours: "Lun–Sáb · 8:00–18:00",
    phone: "+57 (601) 456-7890",
    coordinates: {
      lat: 4.5976,
      lng: -74.0734,
    },
    features: [
      "Centro histórico",
      "Catas guiadas los sábados",
      "Café para llevar",
      "Asesoría barista",
    ],
    description:
      "A pocos metros de la Plaza de Bolívar y el Chorro de Quevedo. Celebramos la tradición cafetera colombiana con catas guiadas sensoriales y café fresco empacado en el día.",
    googleMapsUrl: "https://www.google.com/maps/dir/?api=1&destination=4.5976,-74.0734",
    wazeUrl: "https://waze.com/ul?ll=4.5976,-74.0734&navigate=yes",
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
