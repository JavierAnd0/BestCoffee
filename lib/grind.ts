import type { GrindFormat } from "./types";

/**
 * Moliendas en orden de grosor (grano → gruesa).
 * - `short`: etiqueta compacta (carrito, resúmenes de pedido).
 * - `label`: etiqueta descriptiva para la ficha de producto, indica el método.
 */
export const GRIND_OPTIONS: {
  value: GrindFormat;
  short: string;
  label: string;
}[] = [
  { value: "WHOLE_BEAN", short: "Grano", label: "Grano" },
  { value: "ESPRESSO", short: "Fina", label: "Fina: Cafetera en casa" },
  { value: "FILTER", short: "Media", label: "Media: Chemex · V60 · Aeropress" },
  { value: "FRENCH_PRESS", short: "Gruesa", label: "Gruesa: Prensa Francesa" },
];

export const GRIND_ORDER: GrindFormat[] = GRIND_OPTIONS.map((g) => g.value);

export const GRIND_LABEL = Object.fromEntries(
  GRIND_OPTIONS.map((g) => [g.value, g.label]),
) as Record<GrindFormat, string>;

export const GRIND_SHORT = Object.fromEntries(
  GRIND_OPTIONS.map((g) => [g.value, g.short]),
) as Record<GrindFormat, string>;

export function sortGrinds(grinds: GrindFormat[]): GrindFormat[] {
  return [...grinds].sort((a, b) => GRIND_ORDER.indexOf(a) - GRIND_ORDER.indexOf(b));
}

