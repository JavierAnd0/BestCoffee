#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador procedural de textura PBR de CAFÉ MOLIDO (tileable, 1024x1024).

Salida (en public/hero/):
  coffee-grounds-albedo.jpg   color sRGB
  coffee-grounds-normal.jpg   normal map OpenGL (+Y arriba), espacio tangente
  coffee-grounds-rough.jpg    roughness en escala de grises

Método (todo con numpy + Pillow, sin scipy, sin fotos de referencia):
  1. "Splatting" de decenas de miles de gránulos angulosos e irregulares
     (contorno = elipse deformada por armónicos + cortes planos tipo astilla),
     tamaños log-normales, con z-buffer de alturas (los gránulos se apilan).
     Todo envuelve en los bordes (módulo N) => tileable sin costuras.
  2. Capa de polvo fino: miles de partículas de 1-3 px + ruido de alta frecuencia.
  3. Albedo: tono aleatorio por gránulo (marrón muy oscuro -> marrón rojizo),
     oclusión de cavidad (entre gránulos más oscuro), variación lenta de tono,
     polvo más claro/mate, pocos destellos diminutos.
  4. Normal map desde el mapa de altura (diferencias finitas periódicas).
  5. Roughness alta 0.85-1.0 con ligera variación.

Uso:  python3 coffee_grounds.py [--out DIR] [--seed N] [--debug]
"""
import argparse
import os
import numpy as np
from PIL import Image

N = 1024  # tamaño de la textura (px)


# --------------------------------------------------------------------------
# Utilidades periódicas (todo envuelve en los bordes)
# --------------------------------------------------------------------------
def ruido_periodico(rng, n, beta=1.0, fmin=1, fmax=None):
    """Ruido tileable por filtrado FFT con espectro 1/f^beta. Devuelve media 0, std 1."""
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    f = np.sqrt(fx**2 + fy**2)
    amp = np.zeros_like(f)
    m = f >= fmin
    if fmax is not None:
        m &= f <= fmax
    amp[m] = f[m] ** (-beta)
    blanco = rng.standard_normal((n, n))
    r = np.fft.ifft2(np.fft.fft2(blanco) * amp).real
    r -= r.mean()
    return r / (r.std() + 1e-9)


def desenfoque_gauss(a, sigma):
    """Gauss periódico vía FFT."""
    n = a.shape[0]
    fy = np.fft.fftfreq(n)[:, None]
    fx = np.fft.fftfreq(n)[None, :]
    g = np.exp(-2.0 * (np.pi * sigma) ** 2 * (fx**2 + fy**2))
    return np.fft.ifft2(np.fft.fft2(a) * g).real


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------------------
# 1) Gránulos
# --------------------------------------------------------------------------
def generar_granulos(rng, H, ID, n_granulos, mediana_px, sigma_log, capa_base, escala_alt,
                     min_px=2.5, max_px=38.0, h_ruido=None):
    """
    Dibuja gránulos en el z-buffer H (alturas) e ID (índice de gránulo ganador).
    Cada gránulo: contorno irregular + facetas planas inclinadas + borde redondeado.
    Devuelve la lista de propiedades por gránulo.
    """
    props = []
    for _ in range(n_granulos):
        d = float(np.clip(rng.lognormal(np.log(mediana_px), sigma_log), min_px, max_px))
        # elongación: los gránulos molidos son astillas/placas irregulares
        elong = 1.0 + abs(rng.normal(0, 0.35))
        a = d * 0.5 * elong
        b = d * 0.5 / np.sqrt(elong) * rng.uniform(0.7, 1.0)
        ang = rng.uniform(0, np.pi)
        ca, sa = np.cos(ang), np.sin(ang)
        cx, cy = rng.uniform(0, N), rng.uniform(0, N)

        R = int(max(a, b) * 1.45) + 2
        ys = (np.arange(-R, R + 1) + int(cy)) % N
        xs = (np.arange(-R, R + 1) + int(cx)) % N
        py, px = np.meshgrid(np.arange(-R, R + 1) - (cy - int(cy)),
                             np.arange(-R, R + 1) - (cx - int(cx)), indexing="ij")
        # coordenadas locales rotadas y normalizadas por semiejes
        u = (px * ca + py * sa) / a
        v = (-px * sa + py * ca) / b
        r = np.sqrt(u * u + v * v) + 1e-9
        th = np.arctan2(v, u)
        # contorno: radio modulado por armónicos aleatorios (forma de astilla)
        borde = np.ones_like(th)
        for k in (2, 3, 4, 5, 7):
            borde += rng.normal(0, 0.16 / (k ** 0.5)) * np.cos(k * th + rng.uniform(0, 6.28))
        s = r / np.clip(borde, 0.4, None)
        # cortes planos: 2-3 caras angulosas
        for _c in range(rng.integers(2, 4)):
            phi = rng.uniform(0, 6.28)
            off = rng.uniform(0.55, 0.95)
            s = np.maximum(s, (u * np.cos(phi) + v * np.sin(phi)) / off)
        dentro = s < 1.0
        if not dentro.any():
            props.append(None)
            continue
        # perfil: meseta con borde redondeado (más "chip" que cúpula)
        pe = rng.uniform(1.3, 2.4)
        perfil = np.clip(1.0 - s ** pe, 0, 1) ** rng.uniform(0.6, 0.95)
        # cara superior inclinada aleatoriamente + abombamiento
        gx, gy = rng.normal(0, 0.25, 2)
        cara = gx * u + gy * v
        base = capa_base * rng.uniform(0, 1) ** 0.8
        alto = base + escala_alt * (0.5 * d / mediana_px) ** 0.5 * (perfil * (1 + 0.5 * cara))
        alto = np.where(dentro, alto, -1.0)
        idx = np.ix_(ys, xs)
        Hl = H[idx]
        gana = alto > Hl
        if gana.any():
            Hl = np.where(gana, alto, Hl)
            IDl = ID[idx]
            IDl = np.where(gana, len(props), IDl)
            H[idx] = Hl
            ID[idx] = IDl
        props.append(dict(d=d, mate=rng.random()))
    return props


def generar_polvo(rng, H, ID, n, h0, nprops, props):
    """Partículas diminutas (1-3 px) estampadas con maximum.at (vectorizado)."""
    cx = rng.integers(0, N, n)
    cy = rng.integers(0, N, n)
    alt = h0 + rng.uniform(0, 0.9, n)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            r = (dx * dx + dy * dy)
            if r > 1 and rng.random() < 0.5:
                continue
            h = alt - 0.25 * r * rng.uniform(0.5, 1.2, n)
            yy, xx = (cy + dy) % N, (cx + dx) % N
            mejor = np.maximum(H[yy, xx], h)
            gan = h > H[yy, xx]
            # asignar IDs de polvo (nuevos) a los que ganan
            ids = nprops + np.arange(n)
            np.maximum.at(H, (yy, xx), h)
            sel = gan & (H[yy, xx] == h)
            ID[yy[sel], xx[sel]] = ids[sel]


# --------------------------------------------------------------------------
# Pipeline completo
# --------------------------------------------------------------------------
def construir(seed=7):
    rng = np.random.default_rng(seed)
    H = np.full((N, N), -1.0)
    ID = np.full((N, N), -1, dtype=np.int64)
    todas = []

    # capas de grueso a fino: las finas quedan encima de las gruesas
    # (n_granulos, mediana_px, sigma_log, capa_base, escala_alt)
    capas = [
        (1800, 18, 0.40, 0.55, 0.60),   # gránulos grandes (escasos)
        (14000, 10, 0.50, 0.75, 0.55),  # gránulos medianos (mayoría)
        (45000, 5.5, 0.50, 0.95, 0.50), # gránulos pequeños
    ]
    for (ng, med, sl, cb, ea) in capas:
        p = generar_granulos(rng, H, ID, ng, med, sl, cb, ea)
        todas.extend(p)
    nprops = len(todas)
    # polvo
    generar_polvo(rng, H, ID, 90000, 0.2, nprops, todas)
    ndust = 90000
    H[H < 0] = 0.0
    ID[ID < 0] = 0
    return rng, H, ID, todas, nprops, ndust


def texturas(seed=7):
    rng, H, ID, props, nprops, ndust = construir(seed)
    total = nprops + ndust

    # ---------------- propiedades por gránulo ----------------
    t = rng.beta(1.7, 2.6, total)
    # los gránulos grandes tienden a ser más oscuros (evita grandes manchas claras planas)
    dpx = np.array([p['d'] if p else 8.0 for p in props] + [2.0] * ndust)
    t = t * np.clip(1.3 - dpx / 30.0, 0.45, 1.0)                       # tono 0..1 (sesgado a oscuro)
    var_h = rng.normal(0, 1, total)                     # variación de matiz
    claro = (rng.random(total) < 0.02).astype(float)   # gránulos "recién fracturados"
    mate = rng.random(total)

    # altura final = z-buffer + micro-rugosidad (granulado superficial)
    micro = ruido_periodico(rng, N, beta=0.4, fmin=40, fmax=420)
    micro2 = ruido_periodico(rng, N, beta=0.0, fmin=120, fmax=500)
    Hf = H + 0.12 * micro + 0.06 * micro2
    Hf = desenfoque_gauss(Hf, 0.6)

    # ---------------- albedo (sRGB en archivo) ----------------
    oscuro = np.array([0.095, 0.042, 0.018])
    medio = np.array([0.62, 0.325, 0.14])
    claro_c = np.array([0.70, 0.40, 0.19])
    tt = t[ID][..., None]
    col = oscuro + (medio - oscuro) * (tt ** 0.95)
    col = col + (claro_c - col) * (claro[ID][..., None] * 0.45)
    # variación de matiz por gránulo (más rojo / más pardo)
    vh = var_h[ID][..., None]
    col = col * (1 + 0.07 * vh * np.array([1.0, 0.5, -0.8]))

    # polvo: algo más claro, anaranjado apagado
    es_polvo = (ID >= nprops)[..., None]
    col = np.where(es_polvo, col * np.array([1.12, 1.10, 1.05]) + 0.01, col)

    # oclusión de cavidad: Hf - desenfoque(Hf) => negativo en huecos
    cav = Hf - desenfoque_gauss(Hf, 5.0)
    cav2 = Hf - desenfoque_gauss(Hf, 1.6)
    ao = np.clip(1.0 + 1.2 * cav + 0.9 * cav2, 0.12, 1.3)
    ao = suave(ao, 0.15, 1.25) * 0.9 + 0.1
    # profundidad: lo más bajo del z-buffer, más oscuro
    prof = 0.55 + 0.45 * suave(Hf, 0.0, 1.1)
    col = col * (ao * prof)[..., None]
    # cumbres de las fracturas algo más claras y anaranjadas (aristas vivas)
    cresta = np.clip(cav2, 0, None)
    col = col * (1 + 1.2 * cresta)[..., None] * (1 + 0.5 * cresta[..., None] * np.array([0.3, 0.0, -0.8]))

    # variación lenta de tono (zonas más oscuras/claras, ligeramente más rojas/pardas)
    lento = ruido_periodico(rng, N, beta=1.0, fmin=2, fmax=12)
    col = col * (1 + 0.02 * lento)[..., None] * (1 + 0.025 * lento[..., None] * np.array([1, 0, -1.0]))
    # ruido de grano fino por píxel (rompe el color plano dentro de cada gránulo)
    gr = ruido_periodico(rng, N, beta=0.2, fmin=60, fmax=500)
    col = col * (1 + 0.15 * gr)[..., None]
    # facetas internas de cada gránulo (ruido de frecuencia media)
    fac = ruido_periodico(rng, N, beta=0.8, fmin=25, fmax=160)
    col = col * (1 + 0.16 * fac)[..., None]

    # destellos diminutos (pocos píxeles claros)
    chispa = (rng.random((N, N)) < 0.0007) & (Hf > np.percentile(Hf, 70))
    chispa = desenfoque_gauss(chispa.astype(float), 0.7) * 3.0
    col = col + np.clip(chispa, 0, 1)[..., None] * np.array([0.30, 0.22, 0.15])

    col = np.stack([desenfoque_gauss(col[..., k], 0.45) for k in range(3)], -1)  # menos ruido a 1 px => JPEG < 450 KB
    albedo = np.clip(col, 0, 1)

    # ---------------- roughness ----------------
    rg = 0.93 + 0.035 * ruido_periodico(rng, N, beta=0.3, fmin=30, fmax=400)
    rg += 0.025 * (mate[ID] - 0.5)
    # granulos claros / cumbres algo menos rugosos (destello leve)
    rg -= 0.05 * claro[ID] + 0.03 * suave(cav2, 0.05, 0.4)
    rg += 0.03 * es_polvo[..., 0]
    rg = np.clip(rg, 0.82, 1.0)

    return albedo, Hf, rg


def normal_desde_altura(Hf, intensidad=6.5, suavizado=1.0):
    """Normal OpenGL (+Y arriba): n = (-dH/dx, +dH/dfila, 1). Filas crecen hacia abajo."""
    # suavizado leve: el detalle de 1 px no aporta a la vista y dispara el tamaño del JPEG
    if suavizado:
        Hf = desenfoque_gauss(Hf, suavizado)
    dx = (np.roll(Hf, -1, 1) - np.roll(Hf, 1, 1)) * 0.5
    dfila = (np.roll(Hf, -1, 0) - np.roll(Hf, 1, 0)) * 0.5
    nx = -dx * intensidad
    ny = dfila * intensidad
    nz = np.ones_like(nx)
    ln = np.sqrt(nx**2 + ny**2 + nz**2)
    n = np.stack([nx / ln, ny / ln, nz / ln], -1)
    return n


def guardar(albedo, n, rg, out, calidad=82, calidad_normal=72):
    os.makedirs(out, exist_ok=True)
    # albedo: codificar a sRGB 8 bits (los valores ya están en espacio de archivo)
    Image.fromarray((albedo * 255 + 0.5).astype(np.uint8)).save(
        os.path.join(out, "coffee-grounds-albedo.jpg"), quality=calidad, subsampling=0, optimize=True)
    Image.fromarray(((n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save(
        os.path.join(out, "coffee-grounds-normal.jpg"), quality=calidad_normal, subsampling=0, optimize=True)
    Image.fromarray((rg * 255 + 0.5).astype(np.uint8)).save(
        os.path.join(out, "coffee-grounds-rough.jpg"), quality=calidad, optimize=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    aqui = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--out", default=os.path.normpath(os.path.join(aqui, "..", "..", "public", "hero")))
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--normal", type=float, default=6.5, help="intensidad del normal map")
    ap.add_argument("--calidad", type=int, default=82)
    a = ap.parse_args()
    alb, Hf, rg = texturas(a.seed)
    nrm = normal_desde_altura(Hf, a.normal)
    guardar(alb, nrm, rg, a.out, a.calidad)
    for f in ("albedo", "normal", "rough"):
        p = os.path.join(a.out, f"coffee-grounds-{f}.jpg")
        print(p, os.path.getsize(p) // 1024, "KB")
