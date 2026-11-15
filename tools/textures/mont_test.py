# Prueba de montículo: cono macro + normal de detalle (repeat configurable), luz oblicua
import sys, numpy as np
from PIL import Image
rep = float(sys.argv[1]) if len(sys.argv) > 1 else 3
ns = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
HERO = "/Users/javier/BestCoffee/public/hero/"
alb = (np.asarray(Image.open(HERO+"coffee-grounds-albedo.jpg").convert("RGB"))/255.0)**2.2
nrm = np.asarray(Image.open(HERO+"coffee-grounds-normal.jpg").convert("RGB"))/255.0*2-1
W, Hh = 700, 450
y, x = np.mgrid[0:Hh, 0:W]
cx, cy, R = W/2, Hh*0.62, 300
dx, dy = (x-cx)/R, (y-cy)/(R*0.55)
r = np.sqrt(dx**2+dy**2)
masa = r < 1
h = np.clip(1-r, 0, 1)**0.8*0.9
gy, gx = np.gradient(h*R*0.55)
u = ((x/W)*rep*(W/Hh)*0.8) % 1; v = ((y/Hh)*rep) % 1
iu = (u*1023).astype(int); iv = (v*1023).astype(int)
a = alb[iv, iu]; nd = nrm[iv, iu].copy()
nd[..., 0] *= ns; nd[..., 1] *= ns
n = np.stack([-gx*0.9+nd[...,0], gy*0.9+nd[...,1], np.ones_like(gx)*1.0], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
L = np.array([-0.5, 0.55, 0.7]); L /= np.linalg.norm(L)
d = np.clip((n*L).sum(-1), 0, 1)[..., None]
col = a*(0.25+1.9*d)
col = np.clip(col, 0, 1)**(1/2.2)
bg = np.full((Hh, W, 3), 0.80)
col = np.where(masa[..., None], col, bg)
Image.fromarray((col*255).astype(np.uint8)).save(f"/var/folders/6p/h5rlld_d7v12g91bp3pwss_80000gn/T/tex_mound_rep{rep:g}.png")
