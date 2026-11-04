import * as THREE from "three";
import { mulberry32 } from "./math";

/** Todas las texturas se dibujan en un <canvas> pequeño: 0 KB de red. */
function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function radial(ctx: CanvasRenderingContext2D, s: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}

/** Bola suave: vapor. */
export const makeSoftTexture = () =>
  canvasTexture(96, (ctx, s) =>
    radial(ctx, s, [
      [0, "rgba(255,250,244,0.9)"],
      [0.4, "rgba(255,244,232,0.4)"],
      [1, "rgba(255,244,232,0)"],
    ]),
  );

/** Círculo de borde duro: partículas de café molido. */
export const makeDotTexture = () =>
  canvasTexture(32, (ctx, s) =>
    radial(ctx, s, [
      [0, "rgba(255,255,255,1)"],
      [0.78, "rgba(255,255,255,1)"],
      [1, "rgba(255,255,255,0)"],
    ]),
  );

/** Mancha oscura y suave que "apoya" los objetos en el suelo sin sombras en tiempo real. */
export const makeShadowTexture = () =>
  canvasTexture(128, (ctx, s) =>
    radial(ctx, s, [
      [0, "rgba(20,8,2,0.55)"],
      [0.55, "rgba(20,8,2,0.22)"],
      [1, "rgba(20,8,2,0)"],
    ]),
  );

/** Crema del espresso: centro dorado, borde oscuro, con motas. */
export const makeCremaTexture = () =>
  canvasTexture(256, (ctx, s) => {
    radial(ctx, s, [
      [0, "#1d0d05"],
      [0.55, "#2a1308"],
      [0.8, "#3a1c0c"],
      [0.9, "#c8925a"],
      [0.97, "#e6b987"],
      [1, "#6b3c1c"],
    ]);
    const rnd = mulberry32(11);
    for (let i = 0; i < 160; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * s * 0.42;
      ctx.fillStyle = `rgba(230,180,120,${0.05 + rnd() * 0.12})`;
      ctx.beginPath();
      ctx.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 2 + rnd() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

/** Veta de madera: bandas verticales onduladas. */
export const makeWoodTexture = () =>
  canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#6a3d1f";
    ctx.fillRect(0, 0, s, s);
    const rnd = mulberry32(5);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * s;
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "40,20,8" : "150,95,50"},${0.1 + rnd() * 0.22})`;
      ctx.lineWidth = 1 + rnd() * 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= s; y += 16) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 5, y);
      ctx.stroke();
    }
  });

/** Hoja de cafeto: verde con degradado, nervio central y nervios laterales. */
export const makeLeafTexture = () =>
  canvasTexture(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "#2f6a2c");
    g.addColorStop(0.5, "#3f8a37");
    g.addColorStop(1, "#245a26");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(210,235,170,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, s / 2);
    ctx.lineTo(s, s / 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(190,225,150,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 9; i++) {
      const x = (i / 9) * s;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, s / 2);
        ctx.lineTo(x + s * 0.12, s / 2 + dir * s * 0.42);
        ctx.stroke();
      }
    }
  });

/** Ruido granulado en escala de grises: sirve de relieve (bump) para granos y panela. */
export const makeNoiseTexture = (size = 128, seed = 3) =>
  canvasTexture(size, (ctx, s) => {
    const rnd = mulberry32(seed);
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s * s * 0.9; i++) {
      const v = Math.floor(90 + rnd() * 90);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  });

/** Tela de fique (yute): trama cruzada con fibras sueltas. */
export const makeBurlapTexture = () =>
  canvasTexture(512, (ctx, s) => {
    const rnd = mulberry32(9);
    ctx.fillStyle = "#9a7a4e";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "70,45,20" : "230,200,150"},${0.1 + rnd() * 0.22})`;
      ctx.fillRect(0, y + (rnd() - 0.5), s, 1.2);
    }
    for (let x = 0; x < s; x += 3) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "70,45,20" : "230,200,150"},${0.1 + rnd() * 0.22})`;
      ctx.fillRect(x + (rnd() - 0.5), 0, 1.2, s);
    }
    for (let i = 0; i < 220; i++) {
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "100,70,35" : "215,185,135"},0.35)`;
      ctx.lineWidth = 1;
      const x = rnd() * s;
      const y = rnd() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 24, y + (rnd() - 0.5) * 24);
      ctx.stroke();
    }
  });

/** Sello impreso en el costal: bandera + "CAFÉ DE COLOMBIA". Fondo transparente. */
export const makeSackLogoTexture = () => {
  const w = 512;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  // tricolor
  const top = 40;
  ctx.fillStyle = "#e0b000";
  ctx.fillRect(70, top, w - 140, 46);
  ctx.fillStyle = "#1b3f8f";
  ctx.fillRect(70, top + 46, w - 140, 23);
  ctx.fillStyle = "#b5122a";
  ctx.fillRect(70, top + 69, w - 140, 23);
  ctx.fillStyle = "rgba(40,18,8,0.92)";
  ctx.textAlign = "center";
  ctx.font = "bold 66px Georgia, 'Times New Roman', serif";
  ctx.fillText("CAFÉ", w / 2, 220);
  ctx.font = "bold 46px Georgia, 'Times New Roman', serif";
  ctx.fillText("DE COLOMBIA", w / 2, 275);
  ctx.font = "italic 26px Georgia, 'Times New Roman', serif";
  ctx.fillText("Tostado en origen · Eje Cafetero", w / 2, 322);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
};

/** Cuadro de panela: caramelo con vetas. */
export const makePanelaTexture = () =>
  canvasTexture(128, (ctx, s) => {
    const rnd = mulberry32(14);
    ctx.fillStyle = "#9a5b22";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "60,30,8" : "210,150,70"},${0.05 + rnd() * 0.16})`;
      ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 5, 1 + rnd() * 3);
    }
  });

/** Nogal en tablones: veta fina, nudos suaves y variación de tono. Es repetible (sin costuras) para estirarla sobre una mesa grande. */
export const makeTableTexture = () => {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rnd = mulberry32(31);
  const planks = 4;
  const ph = size / planks;
  for (let k = 0; k < planks; k++) {
    const tone = 0.86 + rnd() * 0.26;
    ctx.fillStyle = `rgb(${Math.round(60 * tone)},${Math.round(36 * tone)},${Math.round(21 * tone)})`;
    ctx.fillRect(0, k * ph, size, ph);
    // veta: líneas largas con ondulación periódica (se cierran en el borde)
    for (let i = 0; i < 90; i++) {
      const y = k * ph + rnd() * ph;
      const amp = 1 + rnd() * 5;
      const cyc = 1 + Math.floor(rnd() * 3);
      const ph0 = rnd() * 6.28;
      ctx.strokeStyle = `rgba(${rnd() > 0.45 ? "52,28,12" : "205,150,96"},${0.04 + rnd() * 0.13})`;
      ctx.lineWidth = 0.6 + rnd() * 1.8;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 16) {
        const yy = y + Math.sin((x / size) * Math.PI * 2 * cyc + ph0) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // junta entre tablones
    ctx.fillStyle = "rgba(30,14,6,0.55)";
    ctx.fillRect(0, k * ph, size, 2.5);
    ctx.fillStyle = "rgba(255,225,185,0.10)";
    ctx.fillRect(0, k * ph + 3, size, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

/** Máscara radial: la mesa es sólida cerca y se funde con el fondo muy lejos, sin una línea de horizonte dura. */
export const makeTableMask = () => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.5, "#fff");
  g.addColorStop(0.8, "#777");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};
