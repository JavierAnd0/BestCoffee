import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math
from common import *

def spoon(nu=90, nv=18, L=1.0, th=0.012):
    """Cucharita: cuenco cóncavo + cuello + mango que se ensancha y sube suavemente; con espesor."""
    def smooth(a, b, x):
        t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
    def width(u):
        # perfil continuo: óvalo del cuenco -> cuello fino -> mango que se ensancha y cierra en punta redonda
        bowl = 0.118 * math.sqrt(max(0.0, 1 - ((u - 0.17) / 0.17) ** 2)) if u < 0.34 else 0.0
        neck = 0.020 + 0.016 * smooth(0.34, 1.0, u) ** 1.2
        mango = 0.034 * smooth(0.55, 0.9, u)
        cap = math.sqrt(max(0.0, 1 - ((u - 0.9) / 0.1) ** 2)) if u > 0.9 else 1.0
        w = max(bowl, (neck + mango) * (smooth(0.28, 0.40, u)))
        if u < 0.34: w = max(bowl, neck * smooth(0.3, 0.34, u))
        return max(w * cap, 0.003)
    def zc(u, v):
        base = 0.22 * max(0.0, u - 0.30) ** 1.7        # el mango sube suavemente
        if u < 0.34:
            dep = 0.056 * math.sin(math.pi * min(1.0, u / 0.34)) ** 0.9
            return -dep * (1 - v * v) + base
        return base
    bm = bmesh.new(); top = []; bot = []
    for i in range(nu + 1):
        u = i / nu; w = width(u); rt = []; rb = []
        for j in range(nv + 1):
            v = j / nv * 2 - 1
            z = zc(u, v)
            rt.append(bm.verts.new((u * L, v * w, z + th)))
            rb.append(bm.verts.new((u * L, v * w, z)))
        top.append(rt); bot.append(rb)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
            bm.faces.new((bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j], bot[i][j]))
    for i in range(nu):
        for j in (0, nv):
            a, b, c, d = top[i][j], top[i + 1][j], bot[i + 1][j], bot[i][j]
            bm.faces.new((a, b, c, d) if j == nv else (d, c, b, a))
    for j in range(nv):
        bm.faces.new((top[0][j], top[0][j + 1], bot[0][j + 1], bot[0][j]))
        bm.faces.new((bot[nu][j], bot[nu][j + 1], top[nu][j + 1], top[nu][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    steel = principled("acero_cuchara", (0.85, 0.86, 0.88), rough=0.16, metal=1.0)
    ob = add(spoon(), "spoon", steel)
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.transform(__import__("mathutils").Matrix.Translation((-0.5, 0, 0)))
    studio((0.2, 0.17, 0.15), 0.9); camera((0, -1.6, 1.4), (0, 0, 0), 60)
    render(out + "/../../../tools/blender/out/spoon_prev.png", 900, 500, 40)
    export_glb(out + "/spoon.glb", [ob])
