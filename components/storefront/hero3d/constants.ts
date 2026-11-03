/**
 * ESCALA REAL: 1 unidad ≈ 5 cm.
 *   grano 1.2 cm → 0.25     taza 7 cm → 1.35     moka 3 tazas ~14 cm → 2.8
 *   molino manual ~17 cm → 3.4
 * Los modelos (.glb) se hicieron en Blender (tools/blender/*.py) ya a esta escala.
 * El eje Y es el "riel" por el que baja la cámara: granos → molino → moka → taza.
 */
export const MODEL_URLS = {
  bean: "/models/hero/packed/bean.glb",
  grinder: "/models/hero/packed/grinder.glb",
  moka: "/models/hero/packed/moka.glb",
  branch: "/models/hero/packed/branch.glb",
  ground: "/models/hero/packed/ground.glb",
  spoon: "/models/hero/packed/spoon.glb",
  cup: "/models/taza.opt.glb?v=2",
} as const;

// ── Molino (el origen del modelo está a 1.7 sobre la boca de salida) ──
export const GRINDER_Y = -4.9;
export const GRINDER_OUTLET_Y = GRINDER_Y - 1.7; // salida del café molido
export const GRINDER_TOP_Y = GRINDER_Y + 1.44; // borde de la tolva
export const GRINDER_PILE_Y = GRINDER_Y + 1.0; // piso de la tolva (donde se apilan los granos)
export const CRANK_PIVOT_Y = 1.5; // altura del eje de la manivela dentro del modelo

// ── Moka (origen del modelo = base de la caldera) ──
export const MOKA_SCALE = 0.95;
export const MOKA_UPPER_Y = 1.2; // altura a la que asienta la cámara superior
export const MOKA_FUNNEL_RIM = 1.24 * MOKA_SCALE; // borde del filtro, ya escalado
export const MOKA_HEIGHT = 2.95 * MOKA_SCALE;
export const MOKA_DOSING_Y = GRINDER_OUTLET_Y - 0.8 - MOKA_FUNNEL_RIM; // bajo el molino
export const STOVE_Y = -11.0; // parrilla de la hornilla
export const MOKA_ASSEMBLED_Y = STOVE_Y + 0.05;
export const MOKA_CENTER_Y = MOKA_ASSEMBLED_Y + MOKA_HEIGHT / 2;
export const MOKA_YAW = -Math.PI / 2; // el pico mira hacia +z (izquierda de pantalla)

// ── Taza (modelo glb, alto nativo 2.2156) sobre plato ──
export const CUP_HEIGHT = 1.35;
export const CUP_SCALE = CUP_HEIGHT / 2.2156;
export const SAUCER_H = 0.1;
export const CUP_CENTER_Y = -15.0;
export const CUP_BASE_Y = CUP_CENTER_Y - CUP_HEIGHT / 2 - SAUCER_H;
export const CUP_RIM_Y = CUP_BASE_Y + SAUCER_H + CUP_HEIGHT;
export const CUP_INNER_R = 1.435 * CUP_SCALE;
export const CUP_ROT_Y = -0.45;
export const LIQUID_MIN = 0.425;
export const LIQUID_MAX = 1.095;

/** Punto donde queda la punta del pico al servir. */
export const POUR_TARGET = { x: 0, y: CUP_RIM_Y + 1.05, z: -0.5 } as const;
export const POUR_TILT = 0.95; // ~55°

// Paleta de la bandera de Colombia
export const COLOMBIA = { yellow: "#f2c200", blue: "#1b3f8f", red: "#c8102e" } as const;
