import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math, random
from mathutils import Vector, noise
from common import *
from branch_export import vcol_material

def biscuit(seed, L=1.1, W=0.30, H=0.145, curve=0.035, nl=72, nu=32):
    """Bizcochito horneado en forma de dedo (tipo achira/queso): alargado, ligeramente curvo, extremos redondeados,
    base casi plana, superficie mate dorada con vetas claras, zonas más tostadas y pequeños poros."""
    random.seed(seed); ox = random.random() * 40
    wob = random.uniform(0.6, 1.4); bend = curve * random.choice([-1, 1]) * random.uniform(0.7, 1.3)
    bm = bmesh.new(); lay = bm.verts.layers.color.new("Col")
    rows = []
    for i in range(nl + 1):
        t = i / nl; s = 2 * t - 1
        prof = max(0.0, 1 - abs(s) ** 3.2) ** 0.5            # extremos redondeados, centro casi constante
        swell = 1 + 0.10 * math.sin(t * math.pi * 2.0 * wob + ox)  # leve irregularidad de grosor
        w = W / 2 * prof * swell; h = H * prof * swell
        cx = L * (t - 0.5)
        cy = bend * (1 - s * s) + 0.015 * math.sin(t * 9 + ox)       # curvatura de banana
        row = []
        for j in range(nu):
            u = 2 * math.pi * j / nu
            y = w * math.cos(u); z = h * math.sin(u)
            if z < 0: z *= 0.78                                    # base ligeramente aplanada
            n = noise.fractal(Vector((cx * 9 + ox, y * 9, z * 9)), 0.5, 2.0, 3)
            f = noise.fractal(Vector((cx * 40 + ox, y * 40, z * 40)), 0.6, 2.2, 3)
            k = 1 + n * 0.012 + f * 0.006
            row.append(bm.verts.new((cx, (cy + y) * k, z * k + H * 0.0)))
        rows.append(row)
    for i in range(nl):
        for j in range(nu):
            a, b = rows[i][j], rows[i][(j + 1) % nu]; c, d = rows[i + 1][(j + 1) % nu], rows[i + 1][j]
            try: bm.faces.new((a, b, c, d))
            except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    print('BISCUIT verts', len(bm.verts), 'faces', len(bm.faces), 'boundary edges', sum(1 for e in bm.edges if e.is_boundary))
    base = Vector((0.86, 0.52, 0.10)); pale = Vector((0.94, 0.72, 0.30)); toast = Vector((0.68, 0.34, 0.05)); under = Vector((0.91, 0.70, 0.32))
    for v in bm.verts:
        x, y, z = v.co
        h = max(0.0, min(1.0, z / (H * 0.8)))
        t = (x / L) + 0.5
        # vetas claras alargadas (ruido estirado a lo largo del bizcocho)
        streak = noise.fractal(Vector((x * 3.0 + ox, y * 38, z * 38)), 0.6, 2.2, 3) * 0.5 + 0.5
        mott = noise.fractal(Vector((x * 14 + ox, y * 14, z * 14)), 0.55, 2.1, 3) * 0.5 + 0.5
        c = base.lerp(toast, max(0.0, (mott - 0.5) * 1.6) * (0.4 + 0.6 * h))
        c = c.lerp(pale, max(0.0, (streak - 0.55) * 2.2) * 0.5)
        c = c.lerp(pale, (1 - min(1.0, min(t, 1 - t) * 9)) * 0.55)    # puntas más claras
        c = c.lerp(under, max(0.0, 1 - h * 2.4) * 0.7)                 # base más pálida
        pits = noise.fractal(Vector((x * 70 + ox, y * 70, z * 70)), 0.9, 2.4, 2)
        c = c * (1.0 + pits * 0.18)
        v[lay] = (max(0, c.x), max(0, c.y), max(0, c.z), 1)
    bm.normal_update(); return bm

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset()
    mat = vcol_material("bizcocho", 0.86, 0.0)
    objs = []
    for k, seed in enumerate((3, 11, 27)):
        ob = add(biscuit(seed), f"biscuit_{k}", mat, (0, 0, 0))
        for p in ob.data.polygons: p.use_smooth = True
        objs.append(ob)
    # vista previa: tres piezas y una pila de ejemplo
    prev = [objs[0].copy(), objs[1].copy(), objs[2].copy()]
    for k, o in enumerate(prev):
        o.data = objs[k].data; bpy.context.collection.objects.link(o)
        o.location = (0.0, -0.55 + k * 0.55, 0.0); o.rotation_euler[2] = 0.1 * (k - 1)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, -0.0)); pl = bpy.context.object
    pm = principled("plato", (0.93, 0.9, 0.84), rough=0.3); pl.data.materials.append(pm)
    studio((0.22, 0.18, 0.14), 0.9); camera((0.3, -2.0, 1.5), (0, 0, 0.05), 55)
    render(out + "/../../../tools/blender/out/biscuit_prev.png", 900, 520, 48)
    for o in prev: bpy.data.objects.remove(o)
    pl.hide_render = True
    export_glb(out + "/biscuit.glb", objs)
