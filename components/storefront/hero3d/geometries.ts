import * as THREE from "three";

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/** Suaviza un perfil con una spline: más puntos, curvas sin esquinas. */
export function smooth(pts: [number, number][], per = 6) {
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
export { v2 };

/** Grano de café: elipsoide aplanado con el surco central en una cara. */
export function createBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 24, 18);
  g.scale(1, 0.62, 0.74);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0) {
      const wiggle = 0.07 * Math.sin(x * 3.2);
      const d = z - wiggle;
      const groove = Math.exp(-(d * d) / 0.016) * (1 - Math.min(1, x * x * 0.85));
      pos.setY(i, y - groove * 0.22 * (y / 0.62));
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Cereza de café: esfera ligeramente alargada con el "ombligo" oscuro arriba. */
export function createCherryGeometry() {
  const g = new THREE.SphereGeometry(1, 20, 16);
  g.scale(1, 1.08, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (y > 0.7) pos.setY(i, y - (1 - Math.min(1, r / 0.5)) * 0.14); // hoyuelo
  }
  g.computeVertexNormals();
  return g;
}

/** Hoja de cafeto: lente alargada, curvada a lo largo y plegada por el nervio. */
export function createLeafGeometry() {
  const g = new THREE.PlaneGeometry(1, 0.5, 14, 6);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5; // 0..1 a lo largo
    const v = pos.getY(i) / 0.25; // -1..1 a lo ancho
    const w = Math.pow(Math.sin(Math.PI * u), 0.75); // contorno de lente
    pos.setY(i, v * 0.25 * w);
    pos.setZ(i, -u * u * 0.16 + Math.abs(v) * w * 0.07);
  }
  g.computeVertexNormals();
  return g;
}

// ───────────────────────── Moka (origen = base de la caldera) ─────────────────────────

export function createMokaBoilerGeometry() {
  return lathe(
    v2([[0, 0], [0.76, 0], [0.79, 0.04], [0.73, 0.45], [0.63, 0.84], [0.67, 0.87], [0.67, 0.95], [0, 0.95]]),
    8,
  );
}

/** Filtro (embudo) donde va el café molido. */
export function createMokaFunnelGeometry() {
  return lathe(
    v2([[0, 0.6], [0.3, 0.6], [0.52, 0.96], [0.57, 1.0], [0.52, 1.0], [0.27, 0.7], [0, 0.7]]),
    16,
  );
}

/** Cámara superior (su origen local es su propia base). */
export function createMokaUpperGeometry() {
  return lathe(
    v2([[0, 0], [0.63, 0], [0.66, 0.05], [0.8, 1.0], [0.85, 1.04], [0.85, 1.12], [0.0, 1.12]]),
    8,
  );
}

export function createMokaLidGeometry() {
  return lathe(v2([[0, 0], [0.87, 0], [0.88, 0.04], [0.8, 0.09], [0.45, 0.15], [0, 0.17]]), 8);
}

/** Asa de baquelita: silueta 2D extruida con bisel. */
export function createMokaHandleGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.8, 1.06);
  s.bezierCurveTo(-1.62, 1.18, -1.66, 0.1, -0.76, 0.14);
  s.lineTo(-0.76, 0.34);
  s.bezierCurveTo(-1.28, 0.36, -1.28, 0.9, -0.82, 0.86);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 16,
  });
  g.translate(0, 0, -0.065);
  return g;
}

/** Pico: cono achatado que sobresale del borde superior. */
export function createMokaSpoutGeometry() {
  const g = new THREE.ConeGeometry(0.21, 0.5, 10);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, 0.8, 1.15);
  return g;
}

// ───────────────────────── Molino manual cilíndrico (centrado en y = 0) ─────────────────────────

/** Cuerpo inferior con acanaladuras para el agarre. */
export function createGrinderGripGeometry(segments: number) {
  const pts: [number, number][] = [[0, -1.55]];
  const y0 = -1.55;
  const y1 = 0.12;
  const n = 46;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = y0 + (y1 - y0) * t;
    const ridge = Math.sin(t * Math.PI * 20) > 0 ? 0.012 : 0; // anillos finos
    pts.push([0.5 + ridge, y]);
  }
  pts.push([0.0, y1]);
  return lathe(v2(pts), segments);
}

/** Carcasa superior (acero) bajo la tapa. */
export function createGrinderHousingGeometry(segments: number) {
  return lathe(v2([[0.0, 0.44], [0.47, 0.44], [0.47, 1.0], [0.0, 1.0]]), segments);
}

/** Tapa / tolva de cobre con la abertura por donde entran los granos. */
export function createGrinderHopperGeometry(segments: number) {
  return lathe(
    smooth([[0.5, 1.0], [0.52, 1.05], [0.48, 1.2], [0.36, 1.3], [0.34, 1.28], [0.3, 1.1], [0.0, 1.06]], 4),
    segments,
  );
}
