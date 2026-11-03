"use client";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MODEL_URLS } from "./constants";

/** Geometría y material del grano (para instanciar cientos sin repetir mallas). */
export function useBean() {
  const { scene } = useGLTF(MODEL_URLS.bean);
  let mesh: THREE.Mesh | null = null;
  scene.traverse((o) => {
    if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
  });
  const m = mesh as THREE.Mesh | null;
  return { geometry: m!.geometry as THREE.BufferGeometry, material: m!.material as THREE.Material };
}

export function preloadModels() {
  Object.values(MODEL_URLS).forEach((u) => useGLTF.preload(u));
}
