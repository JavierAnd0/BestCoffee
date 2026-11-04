/**
 * GUION DE CÁMARA — aquí diriges la cinemática.
 * Cada fila es un "plano clave" en un punto del scroll (p de 0 a 1). La cámara
 * viaja suavemente de una fila a la siguiente. Para cambiar un plano, edita sus números:
 *
 *   focusY  altura a la que mira (mundo)         dist   distancia a ese punto (menor = más cerca)
 *   azim    giro alrededor (rad, + = hacia la izquierda de pantalla)
 *   elev    cuánto sube la cámara sobre el foco   fov    apertura (menor = más "tele")
 *
 * Ritmo: 0–12 % costal · 12–32 % caída · 32–48 % molienda · 48–58 % armado
 *        58–74 % hornilla · 74–92 % servido · 92–100 % presentación
 */
import {
  CUP_CENTER_Y,
  GRINDER_TOP_Y,
  GRINDER_Y,
  MOKA_CENTER_Y,
  MOKA_ASSEMBLED_Y,
  MOKA_DOSING_Y,
} from "./constants";
import { clamp01 } from "./math";

export interface Shot {
  p: number;
  focusY: number;
  dist: number;
  azim: number;
  elev: number;
  fov: number;
  note: string;
}


export const SHOTS: Shot[] = [
  { p: 0.0, focusY: 0.55, dist: 4.6, azim: -0.4, elev: 0.15, fov: 32, note: "Macro del costal y la ramita" },
  { p: 0.1, focusY: 0.55, dist: 5.2, azim: -0.15, elev: 0.3, fov: 34, note: "Se abre el plano" },
  { p: 0.17, focusY: -0.6, dist: 6.6, azim: 0.1, elev: 0.5, fov: 35, note: "El costal se levanta; la cámara baja" },
  { p: 0.25, focusY: -2.7, dist: 6.4, azim: 0.28, elev: 0.6, fov: 35, note: "Sigue el hilo de granos que cae" },
  { p: 0.32, focusY: GRINDER_TOP_Y - 0.25, dist: 5.0, azim: 0.15, elev: 0.75, fov: 33, note: "Los granos entran a la tolva" },
  { p: 0.385, focusY: GRINDER_Y + 0.95, dist: 5.6, azim: -0.18, elev: 0.3, fov: 34, note: "Se acopla la manivela" },
  { p: 0.44, focusY: GRINDER_Y + 0.05, dist: 8.6, azim: -0.06, elev: 0.22, fov: 34, note: "Molino, manivela y filtro en un solo cuadro: cae el café" },
  { p: 0.52, focusY: MOKA_DOSING_Y + 1.25, dist: 5.4, azim: 0.12, elev: 1.05, fov: 34, note: "El montículo crece en el filtro" },
  { p: 0.56, focusY: MOKA_CENTER_Y + 1.7 + (MOKA_DOSING_Y - MOKA_ASSEMBLED_Y) * 0.4, dist: 7.0, azim: -0.1, elev: 0.3, fov: 35, note: "La cámara superior desciende" },
  { p: 0.62, focusY: MOKA_CENTER_Y + 0.3, dist: 7.6, azim: -0.2, elev: 0.3, fov: 35, note: "Se arma la moka" },
  { p: 0.66, focusY: MOKA_CENTER_Y + 0.15, dist: 7.8, azim: -0.3, elev: 0.1, fov: 34, note: "Hornilla: llama y vapor" },
  { p: 0.74, focusY: MOKA_CENTER_Y - 1.5, dist: 8.4, azim: 0.0, elev: 0.3, fov: 35, note: "La moka deja la hornilla" },
  { p: 0.81, focusY: CUP_CENTER_Y + 1.5, dist: 9.8, azim: 0.14, elev: 0.5, fov: 35, note: "Servido: toma amplia" },
  { p: 0.88, focusY: CUP_CENTER_Y + 1.35, dist: 9.2, azim: 0.18, elev: 0.5, fov: 34, note: "Chorro y taza de cerca" },
  { p: 0.95, focusY: CUP_CENTER_Y + 0.35, dist: 7.6, azim: 0.3, elev: 1.2, fov: 34, note: "La moka se retira" },
  { p: 1.0, focusY: CUP_CENTER_Y + 0.2, dist: 7.0, azim: 0.4, elev: 2.3, fov: 33, note: "Presentación final" },
];

/** Interpolación Catmull-Rom: la cámara no frena en cada plano, fluye. */
function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

const KEYS: (keyof Omit<Shot, "p" | "note">)[] = ["focusY", "dist", "azim", "elev", "fov"];

export function cameraAt(p: number) {
  const x = clamp01(p);
  let i = 0;
  while (i < SHOTS.length - 2 && x > SHOTS[i + 1].p) i++;
  const s1 = SHOTS[i];
  const s2 = SHOTS[i + 1];
  const s0 = SHOTS[Math.max(0, i - 1)];
  const s3 = SHOTS[Math.min(SHOTS.length - 1, i + 2)];
  const t = clamp01((x - s1.p) / (s2.p - s1.p));
  // suavizado extra del parámetro para que cada plano "respire" un instante
  const te = t * t * (3 - 2 * t) * 0.6 + t * 0.4;
  const out = {} as Record<(typeof KEYS)[number], number>;
  for (const k of KEYS) out[k] = catmull(s0[k], s1[k], s2[k], s3[k], te);
  return out;
}
