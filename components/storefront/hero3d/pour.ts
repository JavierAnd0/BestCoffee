import * as THREE from "three";
import { LIQUID_MAX, LIQUID_MIN } from "./constants";
import { lerp, smoothstep } from "./math";

/** Nivel del café dentro de la taza (desde la base de la taza) según el scroll. */
export function liquidLevel(p: number) {
  return lerp(LIQUID_MIN, LIQUID_MAX, smoothstep(0.84, 0.92, p));
}

/** 0–1: intensidad del chorro (empieza como un hilo y se afina al terminar). */
export function pourActive(p: number) {
  return smoothstep(0.825, 0.85, p) * (1 - smoothstep(0.9, 0.925, p));
}

/** Estado compartido entre la moka (que lo calcula) y las gotas / ondas (que lo leen). */
export const pourState = {
  amount: 0,
  impact: new THREE.Vector3(),
};

export function setPourAmount(a: number) {
  pourState.amount = a;
}
export function setPourImpact(x: number, y: number, z: number) {
  pourState.impact.set(x, y, z);
}
