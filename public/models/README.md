# 3D Models

Drop your Blender export here as `.glb` (glTF 2.0 binary).

Current usage:

| Archivo | Componente | Tamaño recomendado |
|---|---|---|
| `hero.glb` | `components/storefront/hero-model.tsx` | < 2 MB (ideal < 1 MB) |

## Cómo exportar desde Blender

1. **Selecciona el modelo** (o si quieres exportar toda la escena, deselecciona).
2. **File → Export → glTF 2.0 (.glb / .gltf)**.
3. En el panel de la derecha del diálogo:

### Format

- **Format:** `glTF Binary (.glb)` — un solo archivo con texturas embebidas.

### Include

- **Limit to:** marca `Selected Objects` si solo quieres tu modelo.
- **Custom Properties:** desmarca (no las necesitamos).
- **Cameras / Punctual Lights:** desmarca (las luces las pone el componente React).

### Transform

- **+Y Up:** sí (default — three.js usa Y-up).

### Geometry

- **Apply Modifiers:** sí.
- **UVs:** sí.
- **Normals:** sí.
- **Tangents:** sí (necesarios para normal maps si los tienes).
- **Vertex Colors:** opcional.
- **Materials:** `Export` (default).
- **Images:** `Automatic` (default) o `JPEG` si necesitas reducir peso.
- **Compression (Draco):** márcalo si quieres bajar el peso del archivo (lo
  decodificamos automáticamente en cliente; añade ~80 KB al bundle).

### Animation

- Solo si tu modelo tiene animaciones. Si lo dejas estático, desmárcalo.

## Tips para que se vea bien

- **Escala**: el componente espera que el modelo "quepa" en una caja de ~2 unidades
  alrededor del origen. Si tu mug ocupa 50 unidades en Blender, baja la escala
  antes de exportar o pásale `scale={0.04}` al componente.
- **Origen**: centra el modelo en el origen (Object → Set Origin → Origin to
  Geometry). Si el origen está en una esquina, el modelo gira excéntrico.
- **Apply transforms**: `Object → Apply → All Transforms` antes de exportar.
- **Texturas embebidas**: si las imágenes no aparecen, asegúrate de que los
  materiales usen archivos guardados (no "Internal Data"). `File → External
  Data → Pack Resources` antes de exportar.
- **Peso**: para un mug detallado, < 500 KB es factible si bakeas texturas
  y reduces poly count. > 2 MB empieza a impactar el LCP.

## Verificar antes de usar

Abre el `.glb` en https://gltf-viewer.donmccurdy.com/ — si ahí se ve bien,
acá también.

## Cuando termines

Pon el archivo aquí (`/public/models/hero.glb`) y refresca el navegador.
El componente lo carga automáticamente. Si el peso final del export es muy
grande o muy pequeño, ajusta `scale` en `components/storefront/hero.tsx`:

```tsx
<HeroModel scale={0.5} />
```
