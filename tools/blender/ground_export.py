import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *
from branch_export import vcol_material

def mound(n=1800, seed=2):
    """Montículo hecho de ~1500 granos de molienda (trozos angulosos), como en la foto de referencia."""
    random.seed(seed)
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col")
    dark = Vector((0.085, 0.034, 0.014)); mid = Vector((0.20, 0.085, 0.034)); hi = Vector((0.32, 0.145, 0.06))
    for i in range(n):
        r = math.sqrt(random.random()) * 1.0
        a = random.random() * math.tau
        h = max(0.0, 1.0 - r) ** 1.1 * 0.42
        size = random.uniform(0.032, 0.058) * (1.0 + 0.3 * (1 - r))
        c = Vector((math.cos(a) * r, math.sin(a) * r, h - size * 0.3 + random.uniform(-0.01, 0.03)))
        geo = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)["verts"]
        sx, sy, sz = random.uniform(0.6, 1.2), random.uniform(0.6, 1.2), random.uniform(0.5, 1.0)
        rot = random.random() * math.tau
        t = min(1, max(0, random.random() * 0.7 + h * 1.0))
        col = dark.lerp(mid, t * 1.5) if t < 0.67 else mid.lerp(hi, (t - 0.67) * 3)
        col = col * random.uniform(0.85, 1.1)
        for v in geo:
            jit = random.uniform(0.75, 1.15)
            x, y, z = v.co.x * sx * jit, v.co.y * sy * jit, v.co.z * sz * jit
            v.co = Vector((c.x + (x * math.cos(rot) - y * math.sin(rot)) * size, c.y + (x * math.sin(rot) + y * math.cos(rot)) * size, c.z + z * size))
            v[lay] = (col.x, col.y, col.z, 1)
    # núcleo sólido oscuro bajo los granos: sin huecos
    rings = 14; seg = 36; vs = []
    for j in range(rings + 1):
        r = j / rings * 1.02
        h = max(0.0, 1.0 - r) ** 1.1 * 0.42 - 0.05
        row = []
        for k in range(seg):
            a = k / seg * math.tau
            v = bm.verts.new((math.cos(a) * r, math.sin(a) * r, max(h, 0.0))); v[lay] = (0.06, 0.024, 0.01, 1); row.append(v)
        vs.append(row)
    for j in range(rings):
        for k in range(seg): bm.faces.new((vs[j][k], vs[j][(k + 1) % seg], vs[j + 1][(k + 1) % seg], vs[j + 1][k]))
    bm.normal_update(); return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    ob = add(mound(), "ground", vcol_material("molido", 0.9, 0.0))
    for p in ob.data.polygons: p.use_smooth = False
    studio((0.2, 0.17, 0.15), 0.9); camera((0.6, -3.2, 1.6), (0, 0, 0.25), 70)
    render(out + "/../../../tools/blender/out/ground_prev.png", 800, 600, 40)
    export_glb(out + "/ground.glb", [ob])
