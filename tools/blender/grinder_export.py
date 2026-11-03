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
    for k, (m, z) in enumerate([(yel, 0.28), (blu, 0.34), (red, 0.40)]):
        o = lathe([(0.5, z - 0.027), (0.512, z - 0.027), (0.512, z + 0.027), (0.5, z + 0.027)], 96, f"band{k}", m); parts.append(o)
    # carcasa de acero superior
    parts.append(lathe([(0.0, 0.2), (0.485, 0.2), (0.485, 0.26), (0.5, 0.265), (0.5, 0.9), (0.47, 0.92), (0.0, 0.92)], 96, "housing", steel))
    # tolva de cobre abierta (los granos caen dentro)
    hop = lathe([(0.47, 0.9), (0.52, 0.93), (0.58, 1.1), (0.68, 1.36), (0.675, 1.38), (0.55, 1.14), (0.48, 1.0), (0.0, 0.96)], 96, "hopper", copper); parts.append(hop)
    # boca de salida
    parts.append(lathe([(0.0, -1.5), (0.5, -1.5), (0.5, -1.56), (0.42, -1.6), (0.40, -1.7), (0.0, -1.7)], 96, "outlet", steel))
    for p in parts: smooth_by_angle(p, 45) if p.name in ("housing", "outlet") else None
    # manivela (pivote en el eje: se gira desde la web)
    piv = bpy.data.objects.new("crank", None); bpy.context.collection.objects.link(piv); piv.location = (0, 0, 1.5)
    shaft = lathe([(0, 0), (0.06, 0), (0.06, 0.55), (0, 0.55)], 24, "shaft", steel); 
    arm_bm = bmesh.new(); bmesh.ops.create_cube(arm_bm, size=1.0)
    for v in arm_bm.verts: v.co = (v.co.x * 1.45 + 0.7, v.co.y * 0.16, v.co.z * 0.11)
    arm = add(arm_bm, "arm", steel, (0, 0, 0.58)); bevel(arm, 0.03, 3); smooth_by_angle(arm, 40)
    knob = lathe([(0, 0), (0.1, 0), (0.13, 0.1), (0.15, 0.26), (0.13, 0.42), (0.09, 0.5), (0, 0.52)], 40, "knob", wood, loc=(1.38, 0, 0.58))
    pin = lathe([(0, 0), (0.05, 0), (0.05, -0.02), (0, -0.02)], 16, "pin", steel)
    cap = lathe([(0, 0), (0.1, 0), (0.12, 0.05), (0, 0.09)], 24, "cap", copper, loc=(0, 0, 0.55))
    for o in (shaft, arm, knob, cap):
        o.parent = piv
    return parts, piv, [shaft, arm, knob, cap]

if __name__ == "__main__":
    out = sys.argv[sys.argv.index("--") + 1]
    reset(); parts, piv, cp = build()
    # recentrar: el cuerpo mide de -1.7 a 1.4; la web lo coloca por su centro (z=-1.65..1.65 aprox)
    studio((0.2, 0.17, 0.15), 0.8); camera((4.6, -7.2, 1.2), (0.3, 0, 0.35), 70)
    render(out + "/../../../tools/blender/out/grinder_prev.png", 700, 900, 40)
    export_glb(out + "/grinder.glb", parts + [piv] + cp)
