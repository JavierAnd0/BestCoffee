import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *
from branch_export import vcol_material

def sgn(x): return 1 if x >= 0 else -1
def spow(x, e): return sgn(x) * abs(x) ** e

def biscuit(L=0.95, W=0.46, H=0.30, nu=96, nv=48, seed=3):
    """Bizcocho tipo 'dedo': superelipsoide alargado, cúpula dorada arriba, miga clara abajo, azúcar glass en puntitos."""
    random.seed(seed); ox = random.random() * 30
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col")
    rows = []
    for i in range(nv + 1):
        v = -math.pi / 2 + math.pi * i / nv
        row = []
        for j in range(nu):
            u = -math.pi + 2 * math.pi * j / nu
            e1, e2 = 0.55, 0.62
            x = L / 2 * spow(math.sin(v), e1)                       # polos en los extremos del bizcocho
            y = W / 2 * spow(math.cos(v), e1) * spow(math.cos(u), e2)
            z = H * spow(math.cos(v), e1) * spow(math.sin(u), e2)
            z = z if z > 0 else z * 0.35            # base casi plana
            n = noise.fractal(Vector((x * 9 + ox, y * 9, z * 9)), 0.55, 2.2, 3)
            k = 1 + n * 0.035
            row.append(bm.verts.new((x * k, y * k, z * k + (0.0 if z > 0 else 0.0))))
        rows.append(row)
    for i in range(nv):
        for j in range(nu):
            a, b = rows[i][j], rows[i][(j + 1) % nu]; c, d = rows[i + 1][(j + 1) % nu], rows[i + 1][j]
            if i == 0 or i == nv - 1:
                try: bm.faces.new((a, b, c, d))
                except ValueError: pass
            else: bm.faces.new((a, b, c, d))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    crumb = Vector((0.93, 0.74, 0.40)); gold = Vector((0.62, 0.34, 0.11)); sugar = Vector((0.97, 0.93, 0.85))
    for v in bm.verts:
        h = max(0.0, v.co.z / H)
        t = max(0.0, min(1.0, h * 1.25 + noise.fractal(v.co * 14 + Vector((ox, 0, 0)), 0.6, 2.1, 3) * 0.28))
        c = crumb.lerp(gold, t ** 0.8)
        # azúcar glass: velo irregular en la cúpula
        s = noise.fractal(v.co * 38 + Vector((0, ox, 0)), 0.7, 2.3, 3)
        if h > 0.45 and s > 0.16:
            c = c.lerp(sugar, min(1.0, (s - 0.16) * 6.0) * 0.55)
        v[lay] = (c.x, c.y, c.z, 1)
    bm.normal_update(); return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    ob = add(biscuit(), "biscuit", vcol_material("bizcocho", 0.78, 0.0))
    for p in ob.data.polygons: p.use_smooth = True
    studio((0.25, 0.2, 0.16), 0.9); camera((0.9, -1.5, 1.0), (0, 0, 0.1), 60)
    render(out + "/../../../tools/blender/out/biscuit_prev.png", 800, 500, 40)
    export_glb(out + "/biscuit.glb", [ob])
