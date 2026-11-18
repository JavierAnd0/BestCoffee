import { formatCop } from "@/lib/format";

/**
 * Paleta categórica de los gráficos, en orden fijo (nunca se recicla). Las tres
 * primeras se validaron juntas sobre fondo claro (separación para daltonismo
 * ΔE ≥ 9). El aqua queda bajo 3:1 de contraste: por eso todo gráfico lleva
 * leyenda con valores y vista de tabla.
 */
export const PALETTE = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
} as const;

export type ValueFormat = "cop" | "count" | "grams";

const COMPACT = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const INT = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function formatValue(v: number, format: ValueFormat, compact = false): string {
  if (format === "cop") {
    return compact ? `$${COMPACT.format(v / 100)}` : formatCop(v);
  }
  if (format === "grams") return formatGrams(v);
  return compact ? COMPACT.format(v) : INT.format(v);
}

export function formatGrams(g: number): string {
  if (g >= 1000) {
    return `${(g / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg`;
  }
  return `${INT.format(g)} g`;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Etiqueta de una cubeta YYYY-MM-DD según la granularidad. */
export function formatBucket(date: string, g: "day" | "week" | "month"): string {
  const [y, m, d] = date.split("-").map(Number);
  if (g === "month") return `${MONTHS[m - 1]} ${y}`;
  const label = `${d} ${MONTHS[m - 1]}`;
  return g === "week" ? `sem. ${label}` : label;
}

export function formatDateLabel(date: string): string {
  return formatBucket(date, "day") + ` ${date.slice(0, 4)}`;
}

export function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
}

export const GRIND_LABEL: Record<string, string> = {
  WHOLE_BEAN: "Grano entero",
  ESPRESSO: "Espresso",
  FILTER: "Filtro",
  FRENCH_PRESS: "Prensa francesa",
};
