import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, math
from common import *

def knurled_body(r=0.5, z0=-1.5, z1=0.2, nu=156, nv=104, amp=0.022, mat=None):
    """Cilindro con grabado de rombos (cross-hatch), como el agarre de un molino manual."""
    bm = bmesh.new()
    rows = []
    for j in range(nv + 1):
        z = z0 + (z1 - z0) * j / nv
        row = []
        edge = min(1.0, j / 2.0, (nv - j) / 2.0)  # liso en los bordes
        for i in range(nu):
            a = math.tau * i / nu
            ridge = min(abs(math.sin(a * 13 + z * 25)), abs(math.sin(a * 13 - z * 25))) - 0.35  # pirámides en rombo
            row.append(bm.verts.new(((r + amp * ridge * edge) * math.cos(a), (r + amp * ridge * edge) * math.sin(a), z)))
        rows.append(row)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((rows[j][i], rows[j][(i + 1) % nu], rows[j + 1][(i + 1) % nu], rows[j + 1][i]))
    cap = bm.faces.new(rows[0][::-1]); cap2 = bm.faces.new(rows[-1])
    bm.normal_update()
    ob = add(bm, "grip", mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def build():
    black = principled("black_anodized", (0.025, 0.024, 0.026), rough=0.48, metal=0.9)
    steel = principled("steel", (0.80, 0.82, 0.84), rough=0.24, metal=1.0)
    copper = principled("copper", (0.93, 0.50, 0.30), rough=0.27, metal=1.0)
    wood = principled("walnut", (0.30, 0.15, 0.07), rough=0.45, metal=0.0, **{"Coat Weight": 0.4})
    yel = principled("yellow", (0.95, 0.72, 0.02), rough=0.35); blu = principled("blue", (0.03, 0.12, 0.45), rough=0.35); red = principled("red", (0.65, 0.03, 0.07), rough=0.35)
    parts = []
    parts.append(knurled_body(mat=black))
    # franjas tricolor sutiles, grabadas en un anillo sobre el agarre
    for k, (m, z) in enumerate([(yel, 0.26), (blu, 0.31), (red, 0.36)]):
        o = lathe([(0.5, z - 0.02), (0.508, z - 0.02), (0.508, z + 0.02), (0.5, z + 0.02)], 96, f"band{k}", m); parts.append(o)
    # ── carcasa de acero con anillos, tolva de cobre con borde enrollado, cuello y tuerca ──
    housing = lathe([(0.0, 0.2), (0.485, 0.2), (0.485, 0.26), (0.5, 0.265), (0.5, 0.40), (0.52, 0.42), (0.52, 0.46), (0.5, 0.48), (0.5, 0.9), (0.47, 0.92), (0.0, 0.92)], 128, "housing", steel)
    bevel(housing, 0.012, 3, 40); smooth_by_angle(housing, 60); parts.append(housing)
    collar = lathe([(0.47, 0.88), (0.53, 0.88), (0.55, 0.92), (0.55, 0.98), (0.53, 1.0), (0.47, 1.0)], 128, "collar", copper)
    bevel(collar, 0.01, 3, 40); smooth_by_angle(collar, 60); parts.append(collar)
    hop = lathe([(0.50, 0.98), (0.52, 1.0), (0.585, 1.14), (0.66, 1.30), (0.705, 1.39), (0.72, 1.42), (0.705, 1.445), (0.68, 1.43), (0.66, 1.40), (0.60, 1.26), (0.535, 1.12), (0.47, 1.02), (0.0, 1.0)], 160, "hopper", copper)
    bevel(hop, 0.006, 3, 40); smooth_by_angle(hop, 70); parts.append(hop)
    outlet = lathe([(0.0, -1.5), (0.5, -1.5), (0.5, -1.56), (0.43, -1.60), (0.42, -1.66), (0.0, -1.66)], 128, "outlet", steel)
    bevel(outlet, 0.01, 3, 40); smooth_by_angle(outlet, 60); parts.append(outlet)
    parts.append(lathe([(0.495, -1.5), (0.52, -1.5), (0.52, -1.44), (0.495, -1.44)], 128, "bottom_ring", copper))
    # ── tapa de la tolva: cúpula baja con labio que abraza el borde; el eje de la manivela sale de su centro ──
    lid = lathe([(0.66, 1.405), (0.735, 1.425), (0.745, 1.45), (0.73, 1.49), (0.66, 1.53), (0.5, 1.575), (0.3, 1.60), (0.14, 1.612), (0.12, 1.62), (0.0, 1.62)], 128, "lid", steel)
    bevel(lid, 0.008, 3, 40); smooth_by_angle(lid, 65); parts.append(lid)
    lid_ring = lathe([(0.735, 1.425), (0.752, 1.44), (0.752, 1.47), (0.735, 1.485), (0.725, 1.47), (0.725, 1.44)], 128, "lid_ring", copper)
    smooth_by_angle(lid_ring, 70); parts.append(lid_ring)
    # ── manivela acodada: eje corto, brazo cónico, codo y perilla de nogal ──
    piv = bpy.data.objects.new("crank", None); bpy.context.collection.objects.link(piv); piv.location = (0, 0, 1.62)
    hub = lathe([(0, 0), (0.10, 0), (0.10, 0.07), (0.075, 0.13), (0.075, 0.2), (0, 0.2)], 48, "hub", steel)
    arm_bm = bmesh.new(); bmesh.ops.create_cube(arm_bm, size=1.0)
    for v in arm_bm.verts:
        k = (v.co.x + 0.5)
        v.co = (v.co.x * 1.1 + 0.55, v.co.y * (0.17 - 0.07 * k), v.co.z * (0.10 - 0.03 * k))
    arm = add(arm_bm, "arm", steel, (0, 0, 0.19)); bevel(arm, 0.025, 3); smooth_by_angle(arm, 50)
    elbow = lathe([(0, 0), (0.075, 0), (0.08, 0.14), (0.0, 0.14)], 32, "elbow", steel, loc=(1.06, 0, 0.18))
    knob = lathe([(0, 0), (0.085, 0), (0.12, 0.05), (0.16, 0.2), (0.155, 0.36), (0.12, 0.50), (0.07, 0.56), (0, 0.575)], 64, "knob", wood, loc=(1.06, 0, 0.30))
    smooth_by_angle(knob, 70)
    cap = lathe([(0, 0), (0.09, 0), (0.1, 0.04), (0.06, 0.1), (0, 0.11)], 32, "cap", copper, loc=(0, 0, 0.19))
    for o in (hub, arm, elbow, knob, cap): o.parent = piv
    cp = [hub, arm, elbow, knob, cap]
    return parts, piv, cp
if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset(); parts, piv, cp = build()
    # recentrar: el cuerpo mide de -1.7 a 1.4; la web lo coloca por su centro (z=-1.65..1.65 aprox)
    studio((0.2, 0.17, 0.15), 0.8); camera((4.6, -7.2, 1.2), (0.3, 0, 0.35), 70)
    render(out + "/../../../tools/blender/out/grinder_prev.png", 700, 900, 40)
    export_glb(out + "/grinder.glb", parts + [piv] + cp)
