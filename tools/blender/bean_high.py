"""Grano de café en alta resolución: surco con grietas, arrugas y asimetría (como la foto de referencia)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *

def make_bean(seed=1, res=(96, 64), crack=True):
    random.seed(seed)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=res[0], v_segments=res[1], radius=1.0)
    ox, oy = random.random() * 50, random.random() * 50
    for v in bm.verts:
        x, y, z = v.co  # x = largo, y = ancho, z = alto (cara superior con surco z>0)
        # silueta: ovoide algo más afilado en un extremo
        taper = 1.0 - 0.18 * max(0.0, x) ** 2
        y2 = y * 0.72 * taper
        z2 = z * 0.56 * (1 - 0.05 * x)
        if z2 < 0: z2 *= 0.85
        # surco serpenteante que se abre en las puntas
        center = 0.07 * math.sin(x * 2.6 + seed) + 0.03 * math.sin(x * 6.1)
        d = y2 - center
        fade = max(0.0, 1 - abs(x) ** 3.0)
        groove = math.exp(-(d * d) / 0.0042) * fade
        if z2 > 0: z2 -= groove * 0.17
        lip = math.exp(-((abs(d) - 0.085) ** 2) / 0.0016) * fade * 0.03 if z2 > 0 else 0
        z2 += lip
        # grietas pequeñas cruzando el surco
        if crack and z2 > 0 and abs(d) < 0.09:
            c = abs(math.sin(x * 22 + noise.noise(Vector((x * 5, ox, oy))) * 3))
            if c > 0.93: z2 -= (c - 0.93) * 1.6 * fade
        # arrugas orgánicas de tostado
        n = noise.fractal(Vector((x * 2.4 + ox, y * 2.4 + oy, z * 2.4)), 0.6, 2.2, 4)
        r = 1 + n * 0.055
        v.co = Vector((x * 1.0 * r, y2 * r, z2 * r))
    bm.normal_update()
    lay = bm.loops.layers.color.new('g')
    for f in bm.faces:
        for l in f.loops:
            x, y, z = l.vert.co
            d = (y / 0.72) - 0.07 * math.sin(x * 2.6 + seed)
            gv = math.exp(-(d * d) / 0.03) * max(0.0, 1 - abs(x) ** 3) if z > 0 else 0.0
            l[lay] = (gv, gv, gv, 1)
    me = bpy.data.meshes.new(f"bean{seed}"); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(f"bean{seed}", me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    return ob

if __name__ == "__main__":
    reset()
    bean_mat = bpy.data.materials.new("bean"); bean_mat.use_nodes = True
    nt = bean_mat.node_tree; N = nt.nodes; L = nt.links
    bsdf = N["Principled BSDF"]
    vc = N.new("ShaderNodeVertexColor"); vc.layer_name = "g"
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.055, 0.020, 0.008, 1)      # tostado oscuro
    ramp.color_ramp.elements[1].color = (0.30, 0.15, 0.065, 1)       # película clara del surco
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 9; nz.inputs["Detail"].default_value = 6
    mix = N.new("ShaderNodeMath"); mix.operation = "MULTIPLY_ADD"
    L.new(vc.outputs["Color"], mix.inputs[0]); mix.inputs[1].default_value = 0.85
    L.new(nz.outputs["Fac"], mix.inputs[2])
    # el ruido aporta manchas de tueste (±) sin aclarar todo el grano
    sub = N.new("ShaderNodeMath"); sub.operation = "MULTIPLY"; L.new(nz.outputs["Fac"], sub.inputs[0]); sub.inputs[1].default_value = 0.28
    add = N.new("ShaderNodeMath"); add.operation = "ADD"
    vcg = N.new("ShaderNodeSeparateColor"); L.new(vc.outputs["Color"], vcg.inputs[0])
    mul = N.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; L.new(vcg.outputs[0], mul.inputs[0]); mul.inputs[1].default_value = 0.9
    L.new(mul.outputs[0], add.inputs[0]); L.new(sub.outputs[0], add.inputs[1])
    L.new(add.outputs[0], ramp.inputs[0]); L.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    rr = N.new("ShaderNodeMath"); rr.operation = "MULTIPLY_ADD"; L.new(nz.outputs["Fac"], rr.inputs[0]); rr.inputs[1].default_value = 0.35; rr.inputs[2].default_value = 0.32
    L.new(rr.outputs[0], bsdf.inputs["Roughness"])
    bsdf.inputs["Coat Weight"].default_value = 0.35; bsdf.inputs["Coat Roughness"].default_value = 0.25
    for i in range(7):
        b = make_bean(i + 1)
        b.location = ((i % 4) * 2.3 - 3.4, (i // 4) * 1.7 - 0.8, 0)
        b.rotation_euler = (random.random() * 0.5, 0, random.random() * 6)
        b.data.materials.append(bean_mat)
    studio((0.18,0.15,0.13), 0.7); camera((0, -9, 10), (0, 0, 0), 70)
    render(sys.argv[-1] if sys.argv[-1].endswith(".png") else "out/bean_test.png", 1100, 650, 40)
