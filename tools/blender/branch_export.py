import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise, Matrix
from common import *

def vcol_material(name, rough=0.3, coat=0.0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links; b = N["Principled BSDF"]
    a = N.new("ShaderNodeVertexColor"); a.layer_name = "Col"; L.new(a.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough; b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.12
    return m

def cherry(seed, color_t):
    """Cereza de café: elipsoide con hoyuelo en el pedúnculo y 'ombligo' oscuro opuesto."""
    random.seed(seed)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=28, radius=1.0)
    lay = bm.verts.layers.color.new("Col")
    ripe = Vector((0.52, 0.015, 0.03)); orange = Vector((0.80, 0.30, 0.03)); green = Vector((0.18, 0.30, 0.04)); navel = Vector((0.06, 0.012, 0.01))
    base = ripe.lerp(orange, color_t) if color_t < 1 else orange.lerp(green, color_t - 1)
    for v in bm.verts:
        x, y, z = v.co
        z2 = z * 1.12
        r = math.hypot(x, y)
        if z2 > 0.78: z2 -= (1 - min(1, r / 0.5)) * 0.2       # hoyuelo del pedúnculo
        if z2 < -0.8:
            z2 += (1 - min(1, r / 0.34)) * 0.07                # ombligo hundido
        n = noise.noise(Vector((x * 3, y * 3, z * 3 + seed))) * 0.025
        v.co = Vector((x * (1 + n), y * (1 + n), z2))
        c = base * (0.9 + 0.2 * (noise.noise(Vector((x * 2, y * 2, z * 2 + seed))) * 0.5 + 0.5))
        if z2 < -0.86: c = base.lerp(navel, min(1, (-0.86 - z2) * 9))
        v[lay] = (c.x, c.y, c.z, 1)
    bm.normal_update(); return bm

def leaf(seed, length=1.0):
    """Hoja de cafeto: lente alargada, brillante, con nervio central y borde ondulado."""
    random.seed(seed); nu, nv = 22, 8
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col"); rows = []
    for j in range(nv + 1):
        t = j / nv * 2 - 1; row = []
        for i in range(nu + 1):
            u = i / nu
            w = math.pow(math.sin(math.pi * u), 0.7) * 0.22 * length
            x = u * length; y = t * w
            z = -u * u * 0.18 * length + abs(t) * w * 0.55 + math.sin(u * 14 + seed) * 0.012 * abs(t) - 0.015 * (1 - abs(t)) ** 2 * 0  # pliegue en V
            z -= 0.025 * (1 - abs(t)) * math.sin(math.pi * u)  # canal del nervio
            v = bm.verts.new((x, y, z))
            g = Vector((0.04, 0.16, 0.035)).lerp(Vector((0.08, 0.30, 0.06)), abs(t) * 0.7)
            if abs(t) < 0.07: g = Vector((0.45, 0.55, 0.2))   # nervio claro
            v[lay] = (g.x, g.y, g.z, 1); row.append(v)
        rows.append(row)
    for j in range(nv):
        for i in range(nu): bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    bm.normal_update(); return bm

def stem(points, radius=0.025, name="stem", mat=None):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = radius; cu.bevel_resolution = 3
    sp = cu.splines.new("NURBS"); sp.points.add(len(points) - 1)
    for p, c in zip(sp.points, points): p.co = (*c, 1)
    sp.order_u = 3; sp.use_endpoint_u = True
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.convert(target="MESH")
    ob = bpy.context.view_layer.objects.active
    if mat: ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def build():
    cher_m = vcol_material("cereza", 0.22, 0.7); leaf_m = vcol_material("hoja", 0.32, 0.5)
    wood = principled("rama", (0.20, 0.12, 0.06), rough=0.7)
    objs = []
    # rama principal que sube y se curva
    trunk = stem([(0, 0, -1.0), (0.1, 0, -0.3), (0.35, 0.05, 0.4), (0.8, 0.1, 0.8), (1.3, 0.1, 0.9)], 0.045, "rama", wood); objs.append(trunk)
    # racimos de cerezas colgando de ramitas
    spots = [((0.2, 0, -0.35), (-0.12, 0.18, -0.55)), ((0.35, 0.05, 0.25), (0.05, -0.22, -0.2)), ((0.65, 0.08, 0.62), (0.15, 0.20, 0.0)),
             ((0.95, 0.12, 0.85), (-0.1, -0.12, -0.35)), ((0.15, 0, -0.1), (-0.3, -0.05, -0.3))]
    seed = 1
    for (a, off) in spots:
        for k in range(3):
            seed += 1
            o = Vector(a); d = Vector(off) + Vector((random.uniform(-.12, .12), random.uniform(-.12, .12), random.uniform(-.1, .05)))
            tip = o + d + Vector((0.05 * k, 0.05 * (k - 1), -0.12 * k))
            objs.append(stem([tuple(o), tuple(o + d * 0.5 + Vector((0, 0, 0.05))), tuple(tip + Vector((0, 0, 0.17)))], 0.012, "pedunculo", wood))
            c = add(cherry(seed, [0.0, 0.0, 0.5, 1.2][seed % 4]), "cereza", cher_m)
            for p in c.data.polygons: p.use_smooth = True
            c.scale = (0.17, 0.17, 0.17); c.location = tip; c.rotation_euler = (random.uniform(-.3, .3), random.uniform(-.3, .3), random.uniform(0, 6)); objs.append(c)
    # hojas por pares
    for i, (loc, rz) in enumerate([((0.3, 0.02, 0.2), 0.7), ((0.45, 0.05, 0.45), -2.3), ((0.7, 0.08, 0.7), 0.5), ((0.85, 0.1, 0.8), -2.6), ((1.2, 0.1, 0.9), 0.2), ((0.1, 0, -0.5), 2.4)]):
        l = add(leaf(i + 3, 1.0), "hoja", leaf_m); l.location = loc; l.rotation_euler = (random.uniform(-.2, .3), random.uniform(0.1, 0.5), rz); l.scale = (0.9, 0.9, 0.9)
        for p in l.data.polygons: p.use_smooth = True
        objs.append(l)
    return objs

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset(); random.seed(4); objs = build()
    studio((0.2, 0.17, 0.15), 0.9); camera((1.5, -5.5, 1.0), (0.55, 0, 0.1), 60)
    render(out + "/../../../tools/blender/out/branch_prev.png", 800, 800, 40)
    export_glb(out + "/branch.glb", objs)
