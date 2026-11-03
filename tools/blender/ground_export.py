import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *
from branch_export import vcol_material

def mound(res=(140, 70), seed=2):
    """Montículo de café molido: domo con grano fino (ruido de alta frecuencia), pequeños grumos y colores variados."""
    random.seed(seed); ox = random.random() * 40
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col")
    bmesh.ops.create_uvsphere(bm, u_segments=res[0], v_segments=res[1], radius=1.0)
    dark = Vector((0.07, 0.028, 0.012)); mid = Vector((0.17, 0.07, 0.028)); hi = Vector((0.30, 0.135, 0.055))
    for v in bm.verts:
        x, y, z = v.co
        r = math.hypot(x, y)
        h = max(0.0, 1.0 - r ** 1.6) ** 0.9 * 0.30                        # perfil de montículo
        big = noise.fractal(Vector((x * 2.6 + ox, y * 2.6, 0)), 0.5, 2.0, 3) * 0.05 * (1 - r)
        clump = max(0.0, noise.noise(Vector((x * 8 + ox, y * 8, 4)))) ** 2 * 0.12 * (1 - r)
        grit = noise.fractal(Vector((x * 60 + ox, y * 60, z * 60)), 0.8, 2.4, 3) * 0.05 * (1 - r * 0.4)
        zz = (h + big + clump + grit) if z >= 0 else 0.0
        if zz < 0.0: zz = 0.0
        ang = math.atan2(y, x); rr = r * (1 + noise.noise(Vector((x * 5, y * 5, ox))) * 0.05)
        v.co = Vector((math.cos(ang) * rr, math.sin(ang) * rr, zz))
        t = noise.fractal(Vector((x * 22 + ox, y * 22, zz * 22)), 0.65, 2.3, 3) * 0.5 + 0.5
        t = min(1, max(0, t + zz * 0.5 + random.uniform(-0.12, 0.12)))
        c = dark.lerp(mid, t * 1.6) if t < 0.62 else mid.lerp(hi, (t - 0.62) * 2.4)
        v[lay] = (c.x, c.y, c.z, 1)
    bm.normal_update(); return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    ob = add(mound(), "ground", vcol_material("molido", 0.9, 0.0))
    for p in ob.data.polygons: p.use_smooth = True
    studio((0.2, 0.17, 0.15), 0.9); camera((0.6, -3.0, 1.2), (0, 0, 0.1), 70)
    render(out + "/../../../tools/blender/out/ground_prev.png", 800, 600, 40)
    export_glb(out + "/ground.glb", [ob])
