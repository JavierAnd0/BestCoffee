import * as THREE from "three";
import { makeNoiseTexture } from "./textures";

/** Material del grano de café (se reutiliza en el costal, la tolva y el plato final). */
export function makeBeanMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.5,
    clearcoat: 0.22,
    clearcoatRoughness: 0.45,
    bumpMap: makeNoiseTexture(128, 3),
    bumpScale: 1.4,
  });
}
