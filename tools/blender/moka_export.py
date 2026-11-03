import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math
from mathutils import Vector
from common import *

R8 = math.pi / 8  # gira el octágono para que una CARA mire a +X (donde va el pico)

def octo(profile, name, mat, loc=(0, 0, 0), w=0.018):
    ob = lathe(profile, 8, name, mat, rot=R8, loc=loc)
    bevel(ob, w, 2, 30); smooth_by_angle(ob, 30)
    return ob

def prism_from_poly(pts, depth, name, mat, loc=(0, 0, 0), bev=0.03):
    """Polígono 2D (x,z) extruido en Y (grosor)."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, -depth / 2, z)) for x, z in pts]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    vv = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=vv, vec=(0, depth, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = add(bm, name, mat, loc)
    bevel(ob, bev, 3, 40); smooth_by_angle(ob, 40)
    return ob

def bez(p0, p1, p2, p3, n=14):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out

def build():
    alu = principled("aluminio", (0.80, 0.82, 0.85), rough=0.34, metal=1.0)
    alu_dark = principled("aluminio_int", (0.45, 0.46, 0.48), rough=0.5, metal=1.0)
    bak = principled("baquelita", (0.015, 0.013, 0.013), rough=0.28, **{"Coat Weight": 0.6, "Coat Roughness": 0.15})
    brass = principled("laton", (0.85, 0.62, 0.22), rough=0.3, metal=1.0)

    # ── Caldera (origen en la base) ──
    boiler = octo([(0, 0), (0.92, 0), (0.95, 0.035), (0.88, 0.55), (0.82, 0.98), (0.0, 0.98)], "boiler", alu)
    ring = octo([(0.78, 1.0), (0.9, 1.0), (0.93, 1.04), (0.93, 1.17), (0.90, 1.2), (0.78, 1.2)], "ring", alu, w=0.012)  # aro central
    # válvula de seguridad (latón) en la cara +Y de la caldera
    valve_b = bmesh.new(); bmesh.ops.create_cone(valve_b, cap_ends=True, segments=16, radius1=0.09, radius2=0.07, depth=0.12)
    valve = add(valve_b, "valve", brass, (0.0, 0.8, 0.6)); valve.rotation_euler = (math.pi / 2, 0, 0)
    # filtro (embudo) — visible cuando se retira la cámara superior
    funnel = lathe([(0.0, 0.7), (0.3, 0.7), (0.7, 1.16), (0.78, 1.21), (0.78, 1.24), (0.7, 1.22), (0.28, 0.78), (0.0, 0.78)], 48, "funnel", alu_dark)
    smooth_by_angle(funnel, 50)
    # ── Cámara superior (origen en su base, ensamblada en z=1.2) ──
    upper_loc = (0, 0, 1.2)
    upper = octo([(0, 0), (0.82, 0), (0.84, 0.04), (0.98, 1.2), (1.0, 1.28), (0.0, 1.28)], "upper", alu, upper_loc)
    lid = octo([(0.0, 1.30), (0.98, 1.30), (1.0, 1.34), (0.94, 1.40), (0.0, 1.44)], "lid", alu, upper_loc, w=0.014)
    knob = lathe([(0, 0), (0.06, 0), (0.07, 0.08), (0.13, 0.12), (0.14, 0.2), (0.08, 0.28), (0, 0.3)], 32, "knob", bak, loc=(0, 0, 1.2 + 1.44))
    # pico: una "lengüeta" triangular que sale de la cara +X del borde
    beak = prism_from_poly([(0.9, 0.0), (1.02, 0.28), (1.34, 0.2), (1.46, 0.06), (1.12, -0.18), (0.9, -0.2)], 0.16, "spout", alu, (0, 0, 1.2 + 1.16), bev=0.03)
    # asa de baquelita (-X): del borde de la cámara superior hasta cerca del aro (coords de mundo)
    outer = bez((-0.86, 2.38), (-1.75, 2.58), (-1.9, 1.15), (-0.78, 1.42))
    inner = bez((-0.8, 1.78), (-1.38, 1.72), (-1.42, 2.2), (-0.9, 2.14))
    handle = prism_from_poly(outer + inner, 0.24, "handle", bak, (0, 0, 0), bev=0.04)
    # punta del pico (marcador para el chorro) y pivote de la cámara
    tip = bpy.data.objects.new("spout_tip", None); bpy.context.collection.objects.link(tip); tip.location = (1.46, 0, 1.2 + 1.2)
    return [boiler, ring, valve, funnel], [upper, lid, knob, beak, handle], tip

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset(); low, up, tip = build()
    studio((0.2, 0.17, 0.15), 0.9); camera((-4.5, -7.5, 3.0), (-0.1, 0, 1.3), 66)
    # más esbelta: una moka real de 3 tazas es más alta que ancha
    K = 0.86
    from mathutils import Matrix
    for o in list(bpy.context.scene.objects):
        o.location.x *= K; o.location.y *= K
        if o.type == "MESH": o.data.transform(Matrix.Diagonal((K, K, 1.0, 1.0)))
    render(out + "/../../../tools/blender/out/moka_prev.png", 800, 900, 48)
    # el cuerpo superior va como hijo de un pivote para animarlo desde la web
    piv = bpy.data.objects.new("upper_group", None); bpy.context.collection.objects.link(piv); piv.location = (0, 0, 1.2)
    # hijos con transformación identidad respecto al pivote: su posición local = mundo - pivote
    for o in up + [tip]:
        o.parent = piv
        o.matrix_parent_inverse = Matrix.Identity(4)
        o.location.z -= 1.2
    export_glb(out + "/moka.glb", low + up + [piv, tip])
