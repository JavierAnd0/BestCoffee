import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *
from branch_export import vcol_material

def sgn(x): return 1 if x >= 0 else -1
def spow(x, e): return sgn(x) * abs(x) ** e

def biscuit(L=1.0, W=0.44, H=0.27, r=0.075, cuts=58, seed=3):
    """Bizcocho horneado: caja de bordes redondeados con subdivisión uniforme (sin estirar el relieve),
    techo abombado con grieta longitudinal, costra dorada, miga clara abajo y azúcar glass en velo fino."""
    random.seed(seed); ox = random.random() * 30
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col")
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    hx, hy, hz = L / 2, W / 2, H / 2
    for v in bm.verts:
        q = Vector((v.co.x * hx, v.co.y * hy, v.co.z * hz))
        inner = Vector((hx - r, hy - r, hz - r))
        c = Vector((max(-inner.x, min(inner.x, q.x)), max(-inner.y, min(inner.y, q.y)), max(-inner.z, min(inner.z, q.z))))
        d = q - c
        p = c + d.normalized() * r if d.length > 1e-9 else q
        x, y, z = p.x, p.y, p.z + hz                     # la base queda en z = 0
        if z < 0.18 * H: z *= 1.0
        if z > 0.5 * H:
            z += 0.06 * H * (1 - (2 * x / L) ** 2) * (1 - (2 * y / W) ** 2)         # techo abombado
            yc = y - 0.035 * math.sin(x * 5.0 + ox)                                    # grieta de horneado, irregular
            z -= 0.11 * H * math.exp(-(yc / 0.026) ** 2) * (1 - (2 * x / L) ** 4)
        n = noise.fractal(Vector((x * 6 + ox, y * 6, z * 6)), 0.5, 2.0, 3)
        f = noise.fractal(Vector((x * 30 + ox, y * 30, z * 30)), 0.65, 2.2, 3)
        up = 1.0 if z > 0.25 * H else 0.3
        k = 1 + n * 0.015 + f * 0.014 * up
        v.co = Vector((x * k, y * k, z * k))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    crumb = Vector((0.93, 0.78, 0.46)); gold = Vector((0.60, 0.35, 0.09)); edge = Vector((0.36, 0.19, 0.05)); sugar = Vector((0.98, 0.96, 0.90))
    for v in bm.verts:
        h = max(0.0, min(1.0, v.co.z / H))
        rim = max(0.0, 1.0 - min(abs(v.co.y) / (W / 2), 1.0) ** 3)     # 1 en el centro, 0 en el costado
        t = max(0.0, min(1.0, h * 1.5 + noise.fractal(v.co * 10 + Vector((ox, 0, 0)), 0.6, 2.1, 3) * 0.20))
        c = crumb.lerp(gold, t ** 0.7)
        c = c.lerp(edge, max(0.0, (1 - rim)) * h * 0.55)
        fine = noise.fractal(v.co * 55 + Vector((ox, ox, 0)), 0.8, 2.2, 3)
        c = c * (1.0 + fine * 0.26)                # aristas más tostadas
        # grieta más clara por dentro (masa menos cocida)
        yc = v.co.y - 0.035 * math.sin(v.co.x * 5.0 + ox)
        crack = math.exp(-(yc / 0.030) ** 2) * h
        c = c.lerp(crumb, min(1.0, crack * 0.9))
        # azúcar glass: velo suave y uniforme con zonas más densas en el centro del techo
        s = noise.fractal(v.co * 30 + Vector((0, ox, 0)), 0.65, 2.2, 3) * 0.5 + 0.5
        dust = max(0.0, min(1.0, (h - 0.6) * 2.6)) * max(0.0, (s - 0.35) * 1.6) * (0.4 + 0.6 * rim)
        c = c.lerp(sugar, dust * (1 - crack * 0.6))
        v[lay] = (c.x, c.y, c.z, 1)
    bm.normal_update(); return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    ob = add(biscuit(), "biscuit", vcol_material("bizcocho", 0.88, 0.0))
    for p in ob.data.polygons: p.use_smooth = True
    studio((0.25, 0.2, 0.16), 0.9); camera((0.9, -1.5, 1.0), (0, 0, 0.1), 60)
    render(out + "/../../../tools/blender/out/biscuit_prev.png", 800, 500, 40)
    export_glb(out + "/biscuit.glb", [ob])
