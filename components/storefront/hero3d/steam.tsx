"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "./math";
import { makeSoftTexture } from "./textures";

interface SteamProps {
  count: number;
  /** Devuelve la intensidad (0–1) y escribe en `out` el punto de origen en el mundo. */
  state: (out: THREE.Vector3) => number;
  size?: number;
  rise?: number;
  spread?: number;
  color?: string;
}

/** Vapor: sprites con opacidad individual (sube, se ensancha y se desvanece). */
export function Steam({ count, state, size = 0.5, rise = 1.5, spread = 0.18, color = "#e8d9c8" }: SteamProps) {
  const group = useRef<THREE.Group>(null);
  const map = useMemo(() => makeSoftTexture(), []);
  const sprites = useMemo(() => {
    const rnd = mulberry32(77);
    return Array.from({ length: count }, () => {
      const mat = new THREE.SpriteMaterial({ map, color, transparent: true, opacity: 0, depthWrite: false });
      return { sprite: new THREE.Sprite(mat), phase: rnd(), wob: rnd() * 6.28 };
    });
  }, [count, map, color]);
  const origin = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const amount = state(origin);
    if (group.current) group.current.visible = amount > 0.01;
    if (amount <= 0.01) return;
    const t = clock.elapsedTime;
    sprites.forEach((s) => {
      const life = (t * 0.22 + s.phase) % 1;
      s.sprite.position.set(
        origin.x + Math.sin(t * 0.9 + s.wob) * spread * life,
        origin.y + life * rise,
        origin.z + Math.cos(t * 0.7 + s.wob) * spread * life,
      );
      s.sprite.scale.set(size * (0.55 + life * 1.5), size * (0.7 + life * 1.9), 1);
      (s.sprite.material as THREE.SpriteMaterial).opacity = amount * Math.sin(life * Math.PI) * 0.4;
    });
  });

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s.sprite} />
      ))}
    </group>
  );
}
