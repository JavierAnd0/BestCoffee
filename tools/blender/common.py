"""Utilidades compartidas para modelar la escena del hero en Blender (modo headless)."""
import bpy, bmesh, math, random, sys
from mathutils import Vector, noise

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def args():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

def studio(world_rgb=(0.35, 0.3, 0.26), strength=0.9):
    """Luz de estudio: softbox principal cálida + relleno + fondo."""
    w = bpy.data.worlds.new("W"); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (*world_rgb, 1); bg.inputs[1].default_value = strength
    def area(loc, rot, energy, size, color=(1, 0.95, 0.9)):
        d = bpy.data.lights.new("a", "AREA"); d.energy = energy; d.size = size; d.color = color
        o = bpy.data.objects.new("a", d); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    area((3, -4, 4), (math.radians(55), 0, math.radians(35)), 450, 3)
    area((-4, -2, 2), (math.radians(70), 0, math.radians(-60)), 160, 3, (1, 0.8, 0.65))
    area((0, 4, 3), (math.radians(-60), 0, 0), 220, 4, (0.8, 0.9, 1))

def camera(loc, target=(0, 0, 0), lens=80):
    c = bpy.data.cameras.new("c"); c.lens = lens
    o = bpy.data.objects.new("c", c); bpy.context.collection.objects.link(o); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = o

def render(path, w=1000, h=700, samples=48):
    s = bpy.context.scene
    s.render.engine = "CYCLES"; s.cycles.samples = samples; s.cycles.use_denoising = True
    s.cycles.device = "CPU"
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.filepath = path; s.render.image_settings.file_format = "PNG"
    s.view_settings.view_transform = "AgX"
    bpy.ops.render.render(write_still=True)

def principled(name, base, rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    for k, v in kw.items():
        if k in b.inputs: b.inputs[k].default_value = v
    return m

def smooth_by_angle(ob, deg=35):
    """Sombreado suave salvo en aristas marcadas (caras planas con bordes biselados)."""
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.selected_objects: o.select_set(False)
    ob.select_set(True)
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(deg))
        for m in list(ob.modifiers):
            if m.type == "NODES":
                bpy.ops.object.modifier_apply(modifier=m.name)
    except Exception as e:
        print("smooth fallback:", e)
        for p in ob.data.polygons: p.use_smooth = True

def bevel(ob, width=0.02, segments=2, angle=35):
    bpy.context.view_layer.objects.active = ob
    m = ob.modifiers.new("bev", "BEVEL"); m.width = width; m.segments = segments
    m.limit_method = "ANGLE"; m.angle_limit = math.radians(angle)
    bpy.ops.object.modifier_apply(modifier=m.name)

def add(me_or_bm, name, mat=None, loc=(0, 0, 0)):
    if isinstance(me_or_bm, bmesh.types.BMesh):
        me = bpy.data.meshes.new(name); me_or_bm.to_mesh(me); me_or_bm.free()
    else:
        me = me_or_bm
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); ob.location = loc
    if mat: me.materials.append(mat)
    return ob

def lathe(profile, segments=64, name="lathe", mat=None, rot=0.0, loc=(0, 0, 0)):
    """Gira un perfil [(radio, altura), ...] alrededor del eje Z (como LatheGeometry)."""
    bm = bmesh.new()
    ring = [bm.verts.new((r * math.cos(rot), r * math.sin(rot), z)) for r, z in profile]
    for i in range(len(ring) - 1): bm.edges.new((ring[i], ring[i + 1]))
    bmesh.ops.spin(bm, geom=list(bm.verts) + list(bm.edges), axis=(0, 0, 1), cent=(0, 0, 0), angle=math.tau, steps=segments)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add(bm, name, mat, loc)

def export_glb(path, objects=None):
    """Exporta a glTF (Y arriba). Con `objects`, solo esos; el resto se ignora."""
    for o in bpy.context.scene.objects: o.select_set(False)
    objs = objects or [o for o in bpy.context.scene.objects if o.type in ("MESH", "EMPTY")]
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_materials="EXPORT", export_cameras=False, export_lights=False,
        export_image_format="WEBP" if False else "AUTO")
    print("EXPORTED", path)
