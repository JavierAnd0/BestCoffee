/**
 * ESCALA REAL: 1 unidad ≈ 5 cm.
 *   grano 1.2 cm → 0.25     taza 7 cm → 1.35     moka 3 tazas 14 cm → 2.7
 *   molino manual 17 cm → 3.3     costal pequeño (1 kg) → 3.0
 * El eje Y es el "riel" por el que baja la cámara: costal → molino → moka → taza.
 */

// ── Molino (centro en GRINDER_Y) ──
export const GRINDER_Y = -4.9;
export const GRINDER_HALF_H = 1.65;
export const GRINDER_OUTLET_Y = GRINDER_Y - GRINDER_HALF_H; // salida del café molido
export const GRINDER_TOP_Y = GRINDER_Y + 1.3; // borde de la tolva
export const GRINDER_PILE_Y = GRINDER_Y + 1.08; // piso de la tolva (donde se apilan los granos)

// ── Moka (origen local = base de la caldera; se escala por MOKA_SCALE) ──
export const MOKA_SCALE = 1.1;
export const MOKA_FUNNEL_RIM = 1.0 * MOKA_SCALE; // borde del filtro, ya escalado
export const MOKA_HEIGHT = 2.44 * MOKA_SCALE;
export const MOKA_DOSING_Y = GRINDER_OUTLET_Y - 0.8 - MOKA_FUNNEL_RIM; // bajo el molino
export const STOVE_Y = -11.0; // parrilla de la hornilla
export const MOKA_ASSEMBLED_Y = STOVE_Y + 0.05; // armada, sobre la parrilla
export const MOKA_CENTER_Y = MOKA_ASSEMBLED_Y + MOKA_HEIGHT / 2;
export const MOKA_YAW = -Math.PI / 2; // el pico mira hacia +z (izquierda de pantalla)

// ── Taza (modelo glb, alto nativo 2.2156) sobre plato ──
export const CUP_HEIGHT = 1.35;
export const CUP_SCALE = CUP_HEIGHT / 2.2156;
export const SAUCER_H = 0.1;
export const CUP_CENTER_Y = -15.0;
export const CUP_BASE_Y = CUP_CENTER_Y - CUP_HEIGHT / 2 - SAUCER_H; // fondo del plato
export const CUP_RIM_Y = CUP_BASE_Y + SAUCER_H + CUP_HEIGHT;
export const CUP_INNER_R = 1.435 * CUP_SCALE;
export const CUP_ROT_Y = -0.45;
export const LIQUID_MIN = 0.425; // nivel inicial (desde la base de la taza)
export const LIQUID_MAX = 1.095;

/** Punto donde queda la punta del pico al servir (el chorro cae con un pequeño arco hacia +z). */
export const POUR_TARGET = { x: 0, y: CUP_RIM_Y + 1.05, z: -0.5 } as const;
export const POUR_TILT = 0.95; // ~55°

// ── Costal de fique ──
export const SACK_SCALE = { x: 1.2, y: 0.88, z: 1.2 } as const; // bajo y ancho: un costal, no un tubo
export const SACK_H = 3.0 * SACK_SCALE.y; // 2.64
export const SACK_START_MOUTH = { x: 0, y: SACK_H / 2, z: 0 } as const; // boca, de pie
export const SACK_POUR_MOUTH = { x: 0, y: GRINDER_TOP_Y + 1.55, z: 0 } as const; // boca sobre la tolva

// Paleta de la bandera de Colombia
export const COLOMBIA = { yellow: "#f2c200", blue: "#1b3f8f", red: "#c8102e" } as const;
