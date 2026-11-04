#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hoja de validación: foto real (solo para comparar, NO se usa como textura) | albedo con
shading lambertiano usando el normal map | albedo tileado 2x2. Uso: validar_cafe.py N"""
import sys
import numpy as np
from PIL import Image

N_IT = sys.argv[1] if len(sys.argv) > 1 else "0"
HERO = "/Users/javier/BestCoffee/public/hero/"
alb = np.asarray(Image.open(HERO + "coffee-grounds-albedo.jpg").convert("RGB")) / 255.0
nrm = np.asarray(Image.open(HERO + "coffee-grounds-normal.jpg").convert("RGB")) / 255.0 * 2 - 1
ref = Image.open("/Users/javier/.hermes/cache/scratch/refcrop.png").convert("RGB")


def shade(alb, nrm, luz=(0.55, 0.35, 0.76), amb=0.30, gain=1.9):
    L = np.array(luz) / np.linalg.norm(luz)
    nl = np.clip((nrm * L).sum(-1), 0, 1)
    lin = (alb ** 2.2) * (amb + (1 - amb) * nl[..., None]) * gain
    return np.clip(lin, 0, 1) ** (1 / 2.2)


sh = shade(alb, nrm)
W, Hh = 600, 400
# real: recorte 300x200 ampliado x2 (los gránulos reales ~3-6 px en la foto)
a = ref.resize((W, Hh), Image.LANCZOS)
# mío: crop 600x400 a 1:1 de la textura ya sombreada
b = Image.fromarray((sh[100:100 + Hh, 100:100 + W] * 255).astype(np.uint8))
# 2x2 tileado (en sombreado) reducido a 400x400... mostramos 800x800 -> 600x400 recorte del cruce de costuras
t2 = np.tile(sh, (2, 2, 1))
c = Image.fromarray((t2[1024 - 200:1024 + 200, 1024 - 300:1024 + 300] * 255).astype(np.uint8))
# 2x2 completo reducido
d = Image.fromarray((t2 * 255).astype(np.uint8)).resize((400, 400), Image.LANCZOS)
d_alb = Image.fromarray((np.tile(alb, (2, 2, 1)) * 255).astype(np.uint8)).resize((400, 400), Image.LANCZOS)

hoja = Image.new("RGB", (1800 + 20, 400 + 400 + 10), (255, 255, 255))
hoja.paste(a, (0, 0)); hoja.paste(b, (610, 0)); hoja.paste(c, (1220, 0))
hoja.paste(d, (0, 410)); hoja.paste(d_alb, (410, 410))
alb_im = Image.fromarray((alb * 255).astype(np.uint8)).resize((400, 400), Image.LANCZOS)
hoja.paste(alb_im, (820, 410))
nrm_im = Image.fromarray(((nrm * .5 + .5) * 255).astype(np.uint8)).crop((0, 0, 400, 400))
hoja.paste(nrm_im, (1230, 410))
out = f"/var/folders/6p/h5rlld_d7v12g91bp3pwss_80000gn/T/tex_iter_{N_IT}.png"
hoja.save(out)
print(out, "mean albedo", (alb.reshape(-1, 3).mean(0) * 255).round(1), "mean shaded",
      (sh.reshape(-1, 3).mean(0) * 255).round(1), "ref mean", np.asarray(ref).reshape(-1, 3).mean(0).round(1))
