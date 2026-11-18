/**
 * Utilidades de las guías de preparación, compartidas por el panel (editor) y
 * la tienda (receta, calculadora y temporizador).
 */

export interface BrewRecipe {
  coffeeG: number | null;
  waterMl: number | null;
  tempC: number | null;
  grind: string;
}

export interface BrewStepData {
  title: string;
  body: string;
  durationSec: number;
  /** Agua acumulada al terminar el paso, en gramos. */
  waterG?: number | null;
}

export const EMPTY_RECIPE: BrewRecipe = { coffeeG: null, waterMl: null, tempC: null, grind: "" };

/** Moliendas sugeridas, de la más fina a la más gruesa. */
export const GRIND_SUGGESTIONS = ["Fina", "Media-fina", "Media", "Media-gruesa", "Gruesa"] as const;

/** 270 → "4:30"; 45 → "0:45". */
export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 270 → "4 min 30 s"; 45 → "45 s"; 0 → "". */
export function humanDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (!s) return "";
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (!m) return `${r} s`;
  return r ? `${m} min ${r} s` : `${m} min`;
}

/** "4:30", "4.5", "90" (segundos) → segundos; vacío o inválido → 0. */
export function parseClock(input: string): number {
  const v = input.trim();
  if (!v) return 0;
  const m = v.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function totalSeconds(steps: { durationSec: number }[]): number {
  return steps.reduce((n, s) => n + (s.durationSec || 0), 0);
}

/** Proporción café:agua ("1:16") o null si falta un dato. */
export function ratio(r: Pick<BrewRecipe, "coffeeG" | "waterMl">): string | null {
  if (!r.coffeeG || !r.waterMl) return null;
  const x = r.waterMl / r.coffeeG;
  return `1:${Number.isInteger(x) ? x : x.toFixed(1).replace(".", ",")}`;
}

/** Redondeo amable para una báscula de cocina. */
export function grams(n: number): string {
  const v = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return v.toLocaleString("es-CO");
}

// ── Plantillas para quien crea la guía ───────────────────────────────────────

export interface GuideTemplate {
  id: string;
  method: string;
  summary: string;
  difficulty: "Fácil" | "Media" | "Avanzada";
  recipe: BrewRecipe;
  steps: BrewStepData[];
}

export const GUIDE_TEMPLATES: GuideTemplate[] = [
  {
    id: "v60",
    method: "V60",
    summary: "Una taza limpia y brillante que deja ver las notas frutales y florales del café.",
    difficulty: "Media",
    recipe: { coffeeG: 15, waterMl: 250, tempC: 93, grind: "Media-fina" },
    steps: [
      { title: "Enjuaga el filtro", body: "Pon el filtro en el V60 y mójalo con agua caliente. Bota esa agua.", durationSec: 20, waterG: null },
      { title: "Bloom", body: "Agrega el café, haz un hueco en el centro y vierte agua hasta mojarlo todo. Espera: el café se infla y suelta gas.", durationSec: 40, waterG: 45 },
      { title: "Primer vertido", body: "Vierte en espiral lenta, del centro hacia afuera, sin tocar el papel.", durationSec: 30, waterG: 150 },
      { title: "Segundo vertido", body: "Sigue en espiral hasta completar el agua. Dale un giro suave al V60.", durationSec: 30, waterG: 250 },
      { title: "Deja que drene", body: "Espera a que termine de gotear. La cama de café debe quedar plana.", durationSec: 60, waterG: null },
    ],
  },
  {
    id: "chemex",
    method: "Chemex",
    summary: "Para compartir: cuerpo ligero y una taza muy limpia gracias a su filtro grueso.",
    difficulty: "Media",
    recipe: { coffeeG: 30, waterMl: 500, tempC: 94, grind: "Media-gruesa" },
    steps: [
      { title: "Enjuaga el filtro", body: "Pon el filtro con la parte triple hacia el pico y mójalo. Bota el agua.", durationSec: 20, waterG: null },
      { title: "Bloom", body: "Agrega el café y vierte agua hasta mojarlo todo. Espera.", durationSec: 45, waterG: 90 },
      { title: "Vertidos", body: "Vierte en espiral en tres tandas hasta completar el agua.", durationSec: 120, waterG: 500 },
      { title: "Deja que drene", body: "Retira el filtro cuando el goteo se vuelva lento.", durationSec: 75, waterG: null },
    ],
  },
  {
    id: "aeropress",
    method: "AeroPress",
    summary: "Rápida, limpia y muy perdonadora. Ideal para llevar a cualquier parte.",
    difficulty: "Fácil",
    recipe: { coffeeG: 15, waterMl: 220, tempC: 88, grind: "Media-fina" },
    steps: [
      { title: "Prepara", body: "Pon el filtro en la tapa y mójalo. Arma la AeroPress sobre la taza.", durationSec: 20, waterG: null },
      { title: "Vierte y revuelve", body: "Agrega el café y todo el agua. Revuelve 10 veces.", durationSec: 20, waterG: 220 },
      { title: "Infusiona", body: "Pon el émbolo apenas encima para que no gotee y espera.", durationSec: 60, waterG: null },
      { title: "Presiona", body: "Presiona lento y parejo hasta oír un silbido.", durationSec: 30, waterG: null },
    ],
  },
  {
    id: "prensa",
    method: "Prensa francesa",
    summary: "Cuerpo redondo y rico. Perfecta para tuestes medios y oscuros.",
    difficulty: "Fácil",
    recipe: { coffeeG: 30, waterMl: 500, tempC: 93, grind: "Gruesa" },
    steps: [
      { title: "Vierte", body: "Agrega el café y todo el agua. Asegúrate de mojarlo todo.", durationSec: 20, waterG: 500 },
      { title: "Reposa", body: "Pon la tapa sin bajar el émbolo y espera.", durationSec: 220, waterG: null },
      { title: "Rompe la costra", body: "Revuelve la superficie y retira la espuma con una cuchara.", durationSec: 20, waterG: null },
      { title: "Presiona y sirve", body: "Baja el émbolo despacio y sirve todo de una vez.", durationSec: 20, waterG: null },
    ],
  },
  {
    id: "espresso",
    method: "Espresso",
    summary: "Concentrado, intenso y con crema. La base de un capuchino o un latte.",
    difficulty: "Avanzada",
    recipe: { coffeeG: 18, waterMl: 36, tempC: 93, grind: "Fina" },
    steps: [
      { title: "Dosifica y nivela", body: "Muele el café en el portafiltro y nivélalo con los dedos.", durationSec: 20, waterG: null },
      { title: "Compacta", body: "Presiona con el tamper, recto y firme.", durationSec: 10, waterG: null },
      { title: "Extrae", body: "Inserta y extrae hasta obtener el doble del peso del café en la taza.", durationSec: 28, waterG: 36 },
    ],
  },
  {
    id: "cold-brew",
    method: "Cold brew",
    summary: "Café frío, suave y dulce, que se prepara solo durante la noche.",
    difficulty: "Fácil",
    recipe: { coffeeG: 100, waterMl: 1000, tempC: null, grind: "Gruesa" },
    steps: [
      { title: "Mezcla", body: "Combina el café y el agua fría en un frasco. Revuelve bien.", durationSec: 60, waterG: 1000 },
      { title: "Reposa en la nevera", body: "Tapa y deja reposar entre 12 y 16 horas.", durationSec: 14 * 3600, waterG: null },
      { title: "Filtra", body: "Cuela con un filtro de papel o tela. Sirve con hielo.", durationSec: 300, waterG: null },
    ],
  },
];
