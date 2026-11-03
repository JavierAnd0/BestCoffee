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
      [0, "#c98b4f"],
      [0.55, "#9a5a2b"],
      [0.9, "#4a2410"],
      [1, "#2b1208"],
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
