import { LIQUID_MAX, LIQUID_MIN } from "./constants";
import { lerp, smoothstep } from "./math";

/** Nivel del café dentro de la taza (desde su base) según el progreso del scroll. */
export function liquidLevel(p: number) {
  return lerp(LIQUID_MIN, LIQUID_MAX, smoothstep(0.82, 0.93, p));
}

/** 0–1: cuánto se está sirviendo (el chorro cae entre 0.825 y 0.915). */
export function pourActive(p: number) {
  return smoothstep(0.825, 0.845, p) * (1 - smoothstep(0.895, 0.915, p));
}
