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
