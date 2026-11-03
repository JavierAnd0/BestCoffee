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

/**
 * Grano de café realista: ovoide, una cara convexa y otra más plana, con el
 * surco central en S (más profundo en el medio, abierto en las puntas),
 * un extremo más afilado y el surco más claro (película plateada).
 * El color va en los vértices; luego cada instancia lo oscurece o aclara.
 */
export function createBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 40, 28);
  g.scale(1, 0.58, 0.74);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color("#4a2a17");
  const tan = new THREE.Color("#b98a5a");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    // extremo derecho más afilado, izquierdo más redondo
    if (x > 0) z *= 1 - 0.16 * x * x;
    // cara inferior algo más plana
    if (y < 0) y *= 0.82;
    let groove = 0;
    if (y > 0) {
      const center = 0.1 * Math.sin(x * 2.7); // surco serpenteante
      const d = z - center;
      const lengthFade = Math.max(0, 1 - Math.pow(Math.abs(x), 3.2)); // se abre en las puntas
      groove = Math.exp(-(d * d) / 0.0055) * lengthFade;
      y -= groove * 0.2 * (y / 0.58);
      // labios del surco ligeramente elevados
      y += Math.exp(-((Math.abs(d) - 0.1) ** 2) / 0.004) * 0.02 * lengthFade;
    }
    pos.setXYZ(i, x, y, z);
    c.copy(base).lerp(tan, Math.min(1, groove * 0.9));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
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

/** Pico: lengüeta redondeada (extrusión de un perfil lateral) que sobresale del borde superior. */
export function createMokaSpoutGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.1, 0.12);
  s.lineTo(0.12, 0.12);
  s.quadraticCurveTo(0.42, 0.1, 0.5, -0.08); // la punta cae un poco: guía el chorro
  s.quadraticCurveTo(0.38, -0.02, 0.1, -0.1);
  s.lineTo(-0.1, -0.12);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, -0.17);
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

/** Tapa / tolva de cobre: se ensancha para recibir el hilo de granos. */
export function createGrinderHopperGeometry(segments: number) {
  return lathe(
    smooth([[0.5, 1.0], [0.55, 1.05], [0.62, 1.2], [0.72, 1.36], [0.7, 1.38], [0.6, 1.2], [0.5, 1.08], [0.0, 1.04]], 4),
    segments,
  );
}

/** Costal de fique: tronco de elipse arrugado, boca enrollada y cara interior visible. */
export function createSackGeometry() {
  const outer = smooth(
    [[0, -1.5], [0.55, -1.5], [0.86, -1.38], [0.95, -0.9], [0.93, 0.0], [0.86, 0.8], [0.76, 1.28], [0.73, 1.46]],
    5,
  );
  const rim: [number, number][] = [[0.76, 1.53], [0.72, 1.58], [0.66, 1.52]];
  const inner = smooth([[0.63, 1.46], [0.62, 1.4]], 2);
  const pts = [...outer, ...v2(rim), ...inner, new THREE.Vector2(0, 1.36)];
  const g = new THREE.LatheGeometry(pts, 48);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.01) {
      const a = Math.atan2(x, z);
      const neck = Math.max(0, (y - 0.7) / 0.8); // el cuello se arruga más (está fruncido)
      const amp = 0.04 * Math.max(0, 1 - Math.abs(y) / 1.7) + 0.05 * neck;
      const w = amp * (Math.sin(a * 5 + y * 3.1) + 0.6 * Math.sin(a * 9 - y * 5.3));
      x += (x / r) * w;
      z += (z / r) * w;
    }
    pos.setXYZ(i, x, y, z * 0.64); // aplastado: un costal no es un cilindro perfecto
  }
  g.computeVertexNormals();
  return g;
}

/** Plato de loza. */
export function createSaucerGeometry(segments: number) {
  const out = smooth([[0, 0], [0.55, 0], [0.9, 0.02], [1.2, 0.08], [1.34, 0.12]], 4);
  const inn = smooth([[1.33, 0.13], [1.2, 0.1], [0.85, 0.06], [0.55, 0.05], [0, 0.05]], 4);
  return lathe([...out, ...v2([[1.36, 0.125]]), ...inn], segments);
}
