# Escena 3D del hero · "Del costal a la taza" (Café de Colombia)

Cinemática de scroll hecha con `three` + `@react-three/fiber`. **Todo se dirige con el scroll** (`p` de 0 a 1).

## Guion (qué pasa y cuándo)
| Scroll | Plano |
|---|---|
| 0–12 % | Macro: granos flotando junto a una rama de cafeto con cerezas |
| 12–32 % | Los granos se desprenden en un hilo curvo que baja hasta la tolva del molino; la cámara los sigue |
| 32–48 % | Gira la manivela, el montón se consume y el café molido cae al filtro de la moka |
| 48–58 % | La cámara superior de la moka llega desde un costado y se asienta |
| 58–74 % | Hornilla con llama azul; la moka vibra y echa vapor |
| 74–92 % | La moka se inclina y sirve un chorro curvo con gotas y ondas |
| 92–100 % | Presentación: taza sobre plato con tela de fique, cucharita y granos, con vapor |

## Los modelos vienen de Blender
Grano, molino, moka, rama y café molido se modelan con Python en `tools/blender/` (ver su README) y se
cargan desde `public/models/hero/packed/*.glb` (~1.2 MB en total con la taza). Esta carpeta solo los coloca y anima.

## Cómo dirigir
* **Cámara:** `shots.ts` — una tabla de planos clave (foco, distancia, giro, altura, apertura). Edita los números y la cámara viaja fluida entre filas.
* **Tiempos de cada objeto:** cada archivo usa `smoothstep(a, b, p)` = "entre el a % y el b % del scroll, haz esto".
* **Escala real** (`constants.ts`): 1 unidad ≈ 5 cm (grano 0.25, taza 1.35, moka ~2.7, molino ~3.3).

| Archivo | Qué hace |
|---|---|
| `../hero-scene.tsx` | Canvas, luces, entorno, cámara, pausa fuera de pantalla |
| `shots.ts` | Guion de cámara |
| `beans.tsx` | Granos instanciados que vuelan por una curva + rama de cafeto |
| `grinder.tsx` | Molino (modelo Blender) y café molido cayendo |
| `stove.tsx` | Hornilla y llama |
| `moka.tsx` | Moka (modelo Blender) que se arma, hierve y sirve (chorro = cinta sobre una parábola) |
| `cup.tsx` | Taza original `taza.opt.glb`, café subiendo, plato, tela de fique y granos |
| `assets.ts` / `constants.ts` | Carga de modelos y escala/posiciones |
| `geometries.ts` / `textures.ts` | Formas y texturas hechas por código |
| `quality.ts` | Menos partículas/polígonos en móvil |

## Volver a la escena anterior
`NEXT_PUBLIC_HERO_ENGINE=legacy` en `.env.local` (usa `hero-model.tsx` y los `.glb` originales).

## Fondo de la presentación final
Es una foto 360° real de una cafetería: **Comfy Café** de Sergej Majboroda, publicada en Poly Haven bajo licencia CC0.
Se procesó (tono, desenfoque de profundidad de campo) y se sirve como JPG (`public/hero/cafe-bg.jpg`, 4096×2048 en
escritorio; `cafe-bg-m.jpg`, 2048×1024 en móvil). Para cambiar a qué parte de la cafetería mira la cámara, ajusta `CAFE_YAW` en `cup.tsx`.

## Molino
La tapa, su aro y la manivela se agrupan en un solo conjunto (`lid_and_crank` en `grinder.tsx`): bajan juntos y solo la manivela gira.
