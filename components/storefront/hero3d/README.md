# Escena 3D del hero (Café de Colombia)

Escena de scroll hecha con `three` + `@react-three/fiber` (R3F). Cada archivo es una pieza:

| Archivo | Qué hace |
|---|---|
| `../hero-scene.tsx` | Canvas, luces, entorno, cámara que baja por las estaciones, pausa fuera de pantalla |
| `constants.ts` | **Escala real** (1 u ≈ 5 cm) y posición de cada estación |
| `geometries.ts` | Formas hechas por código. `LatheGeometry` = perfil 2D girado en torno al eje Y |
| `beans.tsx` | Granos (instancing), cerezas y hojas de cafeto |
| `grinder.tsx` | Molino con franjas de la bandera + café molido cayendo |
| `moka.tsx` | Moka: se arma, hierve, se inclina y sirve |
| `cup.tsx` | Taza original `public/models/taza.opt.glb` + café subiendo + vapor |
| `quality.ts` | Menos partículas/polígonos en móvil |

## Cómo se anima
Todo lee `progress.get()` (0–1 del scroll) dentro de `useFrame` y coloca objetos con
`smoothstep(a, b, p)`: "entre el 50 % y el 57 % del scroll, haz esto".

## Regenerar la taza comprimida
`Taza.glb` (2,5 MB) trae una segunda taza naranja duplicada. Se eliminó y se comprimió
(simplificación + meshopt + WebP) con `@gltf-transform`: 139 KB. El original sigue en `public/models/`.

## Volver a la escena anterior
`NEXT_PUBLIC_HERO_ENGINE=legacy` en `.env.local` (usa `hero-model.tsx` y los `.glb` originales).
