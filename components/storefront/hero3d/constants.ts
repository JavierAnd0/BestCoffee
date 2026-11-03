/**
 * ESCALA REAL: 1 unidad ≈ 5 cm.
 *   taza (mug) 7 cm  → 1.35      grano 1.2 cm → ~0.24
 *   moka 3 tazas 14 cm → ~2.7    molino manual 17 cm → ~3.3
 * Las estaciones se separan en el eje Y: la cámara baja por ese "riel".
 */
export const STATION_Y = {
  BEANS: 0,
  GRINDER: -5.9,
  MOKA: -11.0,
  CUP: -15.2,
} as const;

// ── Molino (centrado en STATION_Y.GRINDER; cuerpo de 3.3, más la manivela) ──
export const GRINDER_HALF_H = 1.65;
export const GRINDER_OUTLET_Y = STATION_Y.GRINDER - GRINDER_HALF_H;
export const GRINDER_HOPPER_Y = STATION_Y.GRINDER + 1.28;

// ── Moka (origen local = base de la caldera; se escala por MOKA_SCALE) ──
export const MOKA_SCALE = 1.1;
export const MOKA_FUNNEL_RIM = 1.0 * MOKA_SCALE; // borde del filtro, ya escalado
export const MOKA_HEIGHT = 2.44 * MOKA_SCALE; // caldera + cámara + tapa + perilla
export const MOKA_DOSING_Y = GRINDER_OUTLET_Y - 0.8 - MOKA_FUNNEL_RIM;
export const MOKA_ASSEMBLED_Y = STATION_Y.MOKA - MOKA_HEIGHT / 2;
export const MOKA_YAW = -Math.PI / 2; // el pico mira hacia +z (izquierda de pantalla)

// ── Taza: modelo "taza.opt.glb" (alto nativo 2.2156) ──
export const CUP_HEIGHT = 1.35;
export const CUP_SCALE = CUP_HEIGHT / 2.2156;
export const CUP_BASE_Y = STATION_Y.CUP - CUP_HEIGHT / 2;
export const CUP_RIM_Y = CUP_BASE_Y + CUP_HEIGHT;
export const CUP_INNER_R = 1.435 * CUP_SCALE;
export const CUP_ROT_Y = -0.45; // el asa mira hacia la cámara
export const LIQUID_MIN = 0.425; // nivel inicial, desde la base
export const LIQUID_MAX = 1.095; // nivel lleno

/** Punto del espacio donde debe quedar el pico del moka al servir. */
export const POUR_TARGET = { x: 0, y: CUP_RIM_Y + 1.05, z: 0.25 } as const;
export const POUR_TILT = 0.95; // radianes (~55°)

// Paleta de la bandera de Colombia (acentos, como las franjas de la taza)
export const COLOMBIA = { yellow: "#f2c200", blue: "#1b3f8f", red: "#c8102e" } as const;
