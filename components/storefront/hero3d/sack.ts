import * as THREE from "three";
import { SACK_H, SACK_POUR_MOUTH, SACK_START_MOUTH } from "./constants";
import { lerp, smoothstep } from "./math";

/** Inclinación del costal (rad) según el scroll: de pie → vertiendo sobre el molino. */
export function sackTilt(p: number) {
  return lerp(0, 1.95, smoothstep(0.13, 0.22, p)) + smoothstep(0.24, 0.31, p) * 0.4;
}

/** Dónde está la BOCA del costal en el mundo (sube, se coloca sobre la tolva y luego se retira). */
export function sackMouth(p: number, out: THREE.Vector3) {
  const lift = smoothstep(0.1, 0.2, p);
  const away = smoothstep(0.31, 0.38, p);
  return out.set(
    lerp(SACK_START_MOUTH.x, SACK_POUR_MOUTH.x, lift),
    lerp(SACK_START_MOUTH.y, SACK_POUR_MOUTH.y, lift) + away * 4.5,
    lerp(SACK_START_MOUTH.z, SACK_POUR_MOUTH.z, lift) - away * 2.5,
  );
}

/** Centro del costal: la boca fija el resto (gira sobre su propio centro). */
export function sackCenter(p: number, out: THREE.Vector3) {
  sackMouth(p, out);
  const a = sackTilt(p);
  const half = SACK_H / 2;
  return out.set(out.x, out.y - half * Math.cos(a), out.z - half * Math.sin(a));
}
