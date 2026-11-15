import * as THREE from "three";

/**
 * Montículo de café molido de radio 1 y altura 1 (se escala desde moka.tsx).
 * Perfil de cono con cima redondeada, borde irregular y UV planares (XZ) para que el grano no se estire.
 */
export function createPileGeometry(radial = 72, rings = 28) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rnd = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let r = 0; r <= rings; r++) {
    const t = r / rings; // 0 = cima, 1 = borde
    for (let a = 0; a <= radial; a++) {
      const ang = (a / radial) * Math.PI * 2;
      // borde irregular + pequeñas ondulaciones (derrumbes) que se atenúan hacia la cima
      const wob = 1 + 0.06 * Math.sin(ang * 3 + 1.3) + 0.035 * Math.sin(ang * 7 + 0.4) + 0.02 * Math.sin(ang * 13);
      const rad = t * wob;
      // perfil: casi cónico (ángulo de reposo), cima suavizada
      const h = Math.max(0, 1 - Math.pow(t, 1.15)) * (1 - 0.18 * Math.exp(-t * 9) * 0) + 0.0;
      const crown = 1 - 0.22 * Math.exp(-Math.pow(t / 0.16, 2));
      const lump = 1 + 0.05 * Math.sin(ang * 5 + t * 8) * t;
      const y = h * crown * lump;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      pos.push(x, y, z);
      uv.push(x * 0.5 + 0.5, z * 0.5 + 0.5);
    }
  }
  const row = radial + 1;
  for (let r = 0; r < rings; r++) {
    for (let a = 0; a < radial; a++) {
      const i0 = r * row + a;
      const i1 = i0 + 1;
      const i2 = i0 + row;
      const i3 = i2 + 1;
      idx.push(i0, i1, i2, i1, i3, i2);
    }
  }
  void rnd;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Material PBR del café molido (texturas generadas con tools/textures/coffee_grounds.py). */
export function createPileMaterial(maps: { albedo: THREE.Texture; normal: THREE.Texture; rough: THREE.Texture }) {
  const { albedo, normal, rough } = maps;
  for (const t of [albedo, normal, rough]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = 8;
  }
  albedo.colorSpace = THREE.SRGBColorSpace;
  normal.colorSpace = THREE.NoColorSpace;
  rough.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({
    map: albedo,
    normalMap: normal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughnessMap: rough,
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.45,
    color: new THREE.Color(1.5, 1.45, 1.4), // la textura es oscura (≈5 % de reflectancia): se compensa con la luz de la escena
  });
}
