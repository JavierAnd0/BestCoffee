# Modelos 3D del hero (Blender, sin interfaz)

Cada pieza se modela con Python en Blender 5.x y se exporta a `public/models/hero/*.glb`:

| Script | Pieza |
|---|---|
| `bean_export.py` | Grano de café (surco con grietas, tostado, película clara en el surco) |
| `grinder_export.py` | Molino manual: cuerpo con grabado de rombos, tolva de cobre, manivela (nodo `crank`) |
| `moka_export.py` | Bialetti: caldera, aro, válvula, filtro, cámara superior (`upper_group`) y `spout_tip` |
| `branch_export.py` | Rama de cafeto con cerezas y hojas |
| `ground_export.py` | Montículo de café molido (~1800 trozos) |

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python moka_export.py -- "$PWD/../../public/models/hero"
```
Cada script también deja una vista previa en `tools/blender/out/` (ignorada por git) para compararla con la referencia.

**Empaquetado** (mallas con meshopt, ~1 MB en total): `pack.mjs.txt` es un script de `@gltf-transform`
(renómbralo a `.mjs` dentro de una carpeta con `@gltf-transform/{core,extensions,functions}` y `meshoptimizer`)
y se ejecuta como `node pack.mjs entrada.glb salida.glb`. Importante: `prune({ keepLeaves: true })`,
o se borran los nodos vacíos que usa la web (`spout_tip`).
