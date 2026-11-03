import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *

def build_bean(seed, res):
    random.seed(seed)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=res[0], v_segments=res[1], radius=1.0)
    ox, oy = random.random() * 50, random.random() * 50
    for v in bm.verts:
        x, y, z = v.co
        taper = 1.0 - 0.18 * max(0.0, x) ** 2
        y2 = y * 0.72 * taper
        z2 = z * 0.56 * (1 - 0.05 * x)
        if z2 < 0: z2 *= 0.85
        center = 0.07 * math.sin(x * 2.6 + seed) + 0.03 * math.sin(x * 6.1)
        d = y2 - center
        fade = max(0.0, 1 - abs(x) ** 3.0)
        groove = math.exp(-(d * d) / 0.0042) * fade
        if z2 > 0: z2 -= groove * 0.17
        if z2 > 0: z2 += math.exp(-((abs(d) - 0.085) ** 2) / 0.0016) * fade * 0.03
        n = noise.fractal(Vector((x * 2.4 + ox, y * 2.4 + oy, z * 2.4)), 0.6, 2.2, 4)
        r = 1 + n * 0.055
        v.co = Vector((x * r, y2 * r, z2 * r))
    bm.normal_update()
    lay = bm.verts.layers.color.new("Col") if hasattr(bm.verts.layers, "color") else None
    dark, light = Vector((0.055, 0.02, 0.008)), Vector((0.30, 0.15, 0.065))
    for v in bm.verts:
        x, y, z = v.co
        d = (y / 0.72) - 0.07 * math.sin(x * 2.6 + seed)
        g = math.exp(-(d * d) / 0.03) * max(0.0, 1 - abs(x) ** 3) if z > 0 else 0.0
        st = noise.fractal(Vector((x * 4 + ox, y * 4, z * 4 + oy)), 0.6, 2.2, 4) * 0.5 + 0.5
        t = min(1.0, g * 0.9 + st * 0.22)
        c = dark.lerp(light, t) * (0.9 + 0.2 * random.random() * 0)
        v[lay] = (c.x, c.y, c.z, 1)
    return bm

def bean_material():
    m = bpy.data.materials.new("bean"); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links
    b = N["Principled BSDF"]
    a = N.new("ShaderNodeVertexColor"); a.layer_name = "Col"
    L.new(a.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.42
    b.inputs["Coat Weight"].default_value = 0.3; b.inputs["Coat Roughness"].default_value = 0.3
    return m

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    mat = bean_material()
    bm = build_bean(3, (44, 28))
    ob = add(bm, "bean", mat)
    for p in ob.data.polygons: p.use_smooth = True
    # a ~0.25 de largo (1 unidad = 5 cm) -> el grano mide 2 de largo; se escala en la web
    export_glb(out + "/bean.glb", [ob])
    print("tris", len(ob.data.polygons) * 2)
