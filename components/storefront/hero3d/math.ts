import * as THREE from "three";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 0 → 1 suave entre dos bordes (la "S" clásica de las animaciones). */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const lerp = THREE.MathUtils.lerp;

/** Generador pseudoaleatorio determinista: la escena se ve igual en cada carga. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
