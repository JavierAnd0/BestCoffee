/**
 * Mapa vertical de la escena (unidades de mundo). La cámara baja por este
 * "riel" mientras haces scroll: granos → molino → moka → taza.
 */
export const STATION_Y = {
  BEANS: 0,
  GRINDER: -4.8,
  MOKA: -9.0,
  CUP: -12.8,
} as const;

// ── Molino (centrado en STATION_Y.GRINDER, 2.6 de alto) ──
export const GRINDER_HALF_H = 1.3;
export const GRINDER_OUTLET_Y = STATION_Y.GRINDER - GRINDER_HALF_H;
export const GRINDER_HOPPER_Y = STATION_Y.GRINDER + 1.2;

// ── Moka (origen local = base de la caldera) ──
export const MOKA_FUNNEL_RIM = 1.0; // altura local del borde del filtro
export const MOKA_DOSING_Y = GRINDER_OUTLET_Y - 0.9 - MOKA_FUNNEL_RIM; // bajo el molino
export const MOKA_ASSEMBLED_Y = STATION_Y.MOKA - 1.1; // armada, centrada en su estación
export const MOKA_YAW = -Math.PI / 2; // el pico mira hacia +z (izquierda de pantalla)

// ── Taza (origen local = base) ──
export const CUP_BASE_Y = STATION_Y.CUP - 0.65;
export const CUP_HEIGHT = 1.35;
export const CUP_RIM_Y = CUP_BASE_Y + CUP_HEIGHT + 0.02;
export const LIQUID_MIN = 0.16; // nivel local del fondo
export const LIQUID_MAX = 1.08; // nivel local lleno

/** Punto del espacio donde debe quedar el pico del moka al servir. */
export const POUR_TARGET = { x: 0, y: CUP_RIM_Y + 0.9, z: 0.1 } as const;
export const POUR_TILT = 0.95; // radianes (~55°)
