import * as THREE from "three";

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/** Suaviza un perfil con una spline: más puntos, curvas sin esquinas. */
function smooth(pts: [number, number][], per = 6) {
  return new THREE.SplineCurve(v2(pts)).getPoints((pts.length - 1) * per);
}

/**
 * Un LatheGeometry gira un perfil 2D (radio, altura) alrededor del eje Y.
 * Con pocos segmentos (8) sale la forma octagonal clásica de la moka.
 */
export function lathe(profile: THREE.Vector2[], segments: number) {
  const g = new THREE.LatheGeometry(profile, segments);
  g.computeVertexNormals();
  return g;
}

/** Grano de café: elipsoide aplanado con el surco central en una cara. */
export function createBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 22, 16);
  g.scale(1, 0.6, 0.74);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0) {
      // surco serpenteante a lo largo del eje x
      const wiggle = 0.07 * Math.sin(x * 3.2);
      const d = z - wiggle;
      const groove = Math.exp(-(d * d) / 0.018) * (1 - Math.min(1, x * x * 0.85));
      pos.setY(i, y - groove * 0.2 * (y / 0.6));
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Taza: pared exterior, borde redondeado y pared interior en un solo perfil. */
export function createCupGeometry(segments: number) {
  const outer = smooth(
    [[0, 0], [0.3, 0], [0.42, 0.035], [0.52, 0.22], [0.6, 0.62], [0.66, 1.0], [0.69, 1.34]],
    5,
  );
  const rim: [number, number][] = [[0.685, 1.365], [0.66, 1.385], [0.64, 1.365]];
  const inner = smooth(
    [[0.635, 1.34], [0.6, 0.95], [0.53, 0.5], [0.43, 0.24], [0.3, 0.15], [0, 0.13]],
    5,
  );
  return lathe([...outer, ...v2(rim), ...inner], segments);
}

export function createSaucerGeometry(segments: number) {
  const p = smooth([[0, 0], [0.7, 0], [1.0, 0.03], [1.2, 0.1], [1.26, 0.13]], 4);
  const inner = smooth([[1.25, 0.14], [1.15, 0.1], [0.8, 0.07], [0.55, 0.06], [0, 0.06]], 4);
  return lathe([...p, ...inner], segments);
}

/** Asa de la taza: medio toro. */
export function createCupHandleGeometry() {
  return new THREE.TorusGeometry(0.3, 0.058, 12, 28, Math.PI);
}

// ───────────────────────── Moka (origen = base de la caldera) ─────────────────────────

export function createMokaBoilerGeometry() {
  return lathe(
    v2([[0, 0], [0.7, 0], [0.74, 0.05], [0.68, 0.5], [0.58, 0.92], [0.56, 0.95], [0, 0.95]]),
    8,
  );
}

/** Filtro (embudo) donde va el café molido. */
export function createMokaFunnelGeometry() {
  return lathe(
    v2([[0, 0.6], [0.3, 0.6], [0.5, 0.96], [0.55, 1.0], [0.5, 1.0], [0.26, 0.7], [0, 0.7]]),
    16,
  );
}

/** Cámara superior (su origen local es su propia base). */
export function createMokaUpperGeometry() {
  return lathe(
    v2([[0, 0], [0.58, 0], [0.6, 0.04], [0.76, 1.04], [0.79, 1.1], [0.0, 1.1]]),
    8,
  );
}

export function createMokaLidGeometry() {
  return lathe(v2([[0, 0], [0.84, 0], [0.87, 0.03], [0.8, 0.1], [0.5, 0.16], [0, 0.19]]), 8);
}

/** Asa de baquelita: silueta 2D extruida con bisel. */
export function createMokaHandleGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.78, 1.04);
  s.bezierCurveTo(-1.6, 1.16, -1.6, 0.12, -0.74, 0.14);
  s.lineTo(-0.74, 0.34);
  s.bezierCurveTo(-1.25, 0.36, -1.25, 0.9, -0.8, 0.86);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 14,
  });
  g.translate(0, 0, -0.06);
  return g;
}

/** Pico: cono achatado que sobresale del borde superior. */
export function createMokaSpoutGeometry() {
  const g = new THREE.ConeGeometry(0.2, 0.46, 10);
  g.rotateZ(-Math.PI / 2); // la punta mira hacia +x
  g.scale(1, 0.8, 1.15);
  return g;
}

// ───────────────────────── Molino manual (centrado en y = 0) ─────────────────────────

export function createGrinderBodyGeometry(segments: number) {
  return lathe(
    smooth(
      [[0.0, -1.3], [0.2, -1.3], [0.24, -1.1], [0.55, -0.85], [0.78, -0.3], [0.8, 0.25], [0.7, 0.62], [0.0, 0.62]],
      5,
    ),
    segments,
  );
}

export function createGrinderHopperGeometry(segments: number) {
  return lathe(
    smooth([[0.7, 0.62], [0.74, 0.68], [0.86, 1.0], [0.96, 1.32], [0.92, 1.34], [0.82, 1.06], [0.62, 0.74], [0.0, 0.7]], 4),
    segments,
  );
}
