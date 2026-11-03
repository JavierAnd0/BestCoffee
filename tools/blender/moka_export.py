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
    # válvula de seguridad (latón): base hexagonal, vástago y cúpula; en el hombro de la caldera
    vb = lathe([(0, 0), (0.115, 0), (0.115, 0.035), (0.075, 0.05), (0.075, 0.09), (0.095, 0.10), (0.095, 0.14), (0.05, 0.17), (0, 0.175)], 24, "valve", brass)
    smooth_by_angle(vb, 60); vb.location = (0.0, 0.8, 0.62); vb.rotation_euler = (-math.pi / 2, 0, 0)
    vb.rotation_euler = (-math.pi / 2 + 0.75, 0, 0); vb.scale = (1.15, 1.15, 1.9); vb.location = (0.0, 0.72, 1.0)
    # filtro (embudo) — visible cuando se retira la cámara superior
    funnel = lathe([(0.0, 0.7), (0.3, 0.7), (0.7, 1.16), (0.78, 1.21), (0.78, 1.24), (0.7, 1.22), (0.28, 0.78), (0.0, 0.78)], 48, "funnel", alu_dark)
    smooth_by_angle(funnel, 50)
    # ── Cámara superior (origen en su base, ensamblada en z=1.2) ──
    upper_loc = (0, 0, 1.2)
    upper = octo([(0, 0), (0.82, 0), (0.84, 0.04), (0.98, 1.2), (1.0, 1.28), (0.0, 1.28)], "upper", alu, upper_loc)
    lid = octo([(0.0, 1.30), (0.98, 1.30), (1.0, 1.34), (0.94, 1.40), (0.0, 1.44)], "lid", alu, upper_loc, w=0.014)
    knob = lathe([(0, 0), (0.06, 0), (0.07, 0.08), (0.13, 0.12), (0.14, 0.2), (0.08, 0.28), (0, 0.3)], 32, "knob", bak, loc=(0, 0, 1.2 + 1.44))
    # pico: cuña con canal superior y labio que cae, unida al borde (+X)
    beak_bm = bmesh.new(); nu, nv = 18, 12; rows = []
    x0, L = 0.84, 0.62
    for i in range(nu + 1):
        u = i / nu; x = x0 + L * u
        w = 0.40 * (1 - 0.72 * u ** 1.4)          # se angosta hacia la punta
        z_top = 0.04 - 0.26 * u ** 2.0             # el labio cae
        z_bot = -0.20 + 0.10 * u
        row = []
        for j in range(nv + 1):
            v = j / nv * 2 - 1
            groove = 0.07 * (1 - v * v) * (1 - 0.4 * u)
            zt = z_top - groove
            zb = z_bot + (zt - z_bot) * (1 - (1 - abs(v)) ** 0.5 * 0.0) * 0.0 + (z_bot - 0) * 0
            row.append((bm_v := beak_bm.verts.new((x, v * w, zt))))
        rows.append(row)
    rows_b = []
    for i in range(nu + 1):
        u = i / nu; x = x0 + L * u; w = 0.40 * (1 - 0.72 * u ** 1.4); z_bot = -0.18 + 0.12 * u - 0.28 * u ** 2.0 * 0.6
        rows_b.append([beak_bm.verts.new((x, (j / nv * 2 - 1) * w * (0.86 + 0.14 * (1 - abs(j / nv * 2 - 1))), z_bot)) for j in range(nv + 1)])
    for i in range(nu):
        for j in range(nv):
            beak_bm.faces.new((rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]))
            beak_bm.faces.new((rows_b[i][j + 1], rows_b[i + 1][j + 1], rows_b[i + 1][j], rows_b[i][j]))
    for i in range(nu):
        beak_bm.faces.new((rows[i][0], rows_b[i][0], rows_b[i + 1][0], rows[i + 1][0]))
        beak_bm.faces.new((rows[i][nv], rows[i + 1][nv], rows_b[i + 1][nv], rows_b[i][nv]))
    for j in range(nv):
        beak_bm.faces.new((rows[nu][j], rows[nu][j + 1], rows_b[nu][j + 1], rows_b[nu][j]))
        beak_bm.faces.new((rows[0][j + 1], rows[0][j], rows_b[0][j], rows_b[0][j + 1]))
    bmesh.ops.recalc_face_normals(beak_bm, faces=beak_bm.faces)
    beak = add(beak_bm, "spout", alu, (0, 0, 1.2 + 1.16)); bevel(beak, 0.02, 3, 40); smooth_by_angle(beak, 55)
    # asa de baquelita (-X): tira angular que sale de la cámara superior y baja; más gruesa en el extremo
    path = [(-0.80, 2.34), (-1.18, 2.46), (-1.58, 2.28), (-1.74, 1.86), (-1.62, 1.50), (-1.36, 1.38), (-0.86, 1.42)]
    from mathutils import Vector as V
    pts = []
    n = len(path)
    for i in range(n * 8):
        t = i / (n * 8 - 1) * (n - 1); k = min(int(t), n - 2); f = t - k
        p0, p1 = V(path[max(k - 1, 0)]), V(path[k]); p2 = V(path[k + 1]); p3 = V(path[min(k + 2, n - 1)])
        pts.append(0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3))
    left, right = [], []
    for i, pnt in enumerate(pts):
        a2 = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]; nrm = V((-a2.y, a2.x)).normalized()
        u = i / (len(pts) - 1); w = 0.075 + 0.085 * math.sin(math.pi * u) ** 0.8
        left.append(pnt + nrm * w); right.append(pnt - nrm * w)
    outline = [tuple(q) for q in left] + [tuple(q) for q in right[::-1]]
    handle = prism_from_poly(outline, 0.26, "handle", bak, (0, 0, 0), bev=0.05)
    # soporte metálico entre cámara superior y asa
    brace = prism_from_poly([(-0.80, 2.26), (-0.98, 2.30), (-0.98, 2.46), (-0.80, 2.46)], 0.20, "brace", alu, (0, 0, 0), bev=0.02)
    brace2 = prism_from_poly([(-0.80, 1.36), (-0.96, 1.36), (-0.96, 1.52), (-0.80, 1.52)], 0.20, "brace2", alu, (0, 0, 0), bev=0.02)
    # punta del pico (marcador para el chorro) y pivote de la cámara
    tip = bpy.data.objects.new("spout_tip", None); bpy.context.collection.objects.link(tip); tip.location = (1.46, 0, 1.2 + 1.2)
    return [boiler, ring, vb, funnel], [upper, lid, knob, beak, handle, brace, brace2], tip

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
