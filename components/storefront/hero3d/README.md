# Escena 3D del hero · "Del costal a la taza" (Café de Colombia)

Cinemática de scroll hecha con `three` + `@react-three/fiber`. **Todo se dirige con el scroll** (`p` de 0 a 1).

## Guion (qué pasa y cuándo)
| Scroll | Plano |
|---|---|
| 0–12 % | Macro del costal de fique con granos asomando y una ramita de café (cerezas y hojas) |
| 12–32 % | El costal se levanta, se inclina y vierte un hilo de granos sobre el molino; la cámara los sigue |
| 32–48 % | Gira la manivela, el montón se consume y el café molido cae en cortina al filtro de la moka |
| 48–58 % | La cámara superior de la moka llega desde un costado y se asienta |
| 58–74 % | Hornilla con llama azul; la moka vibra y echa vapor |
| 74–92 % | La moka deja la hornilla, se inclina y sirve un chorro curvo con gotas y ondas |
| 92–100 % | Presentación: taza sobre plato con cucharita, granos y panela, vapor, cámara en órbita lenta |

## Cómo dirigir
* **Cámara:** `shots.ts` — una tabla de planos clave (foco, distancia, giro, altura, apertura). Edita los números y la cámara viaja fluida entre filas.
* **Tiempos de cada objeto:** cada archivo usa `smoothstep(a, b, p)` = "entre el a % y el b % del scroll, haz esto".
* **Escala real** (`constants.ts`): 1 unidad ≈ 5 cm (grano 0.25, taza 1.35, moka ~2.7, molino ~3.3).

| Archivo | Qué hace |
|---|---|
| `../hero-scene.tsx` | Canvas, luces, entorno, cámara, pausa fuera de pantalla |
| `shots.ts` | Guion de cámara |
| `sack.ts` | Dónde está la boca del costal y cuánto se inclina |
| `beans.tsx` | Costal, granos (instancing), ramita de café |
| `grinder.tsx` | Molino y café molido |
| `stove.tsx` | Hornilla y llama |
| `moka.tsx` | Moka que se arma, hierve y sirve (chorro = cinta de geometría sobre una parábola) |
| `cup.tsx` | Taza original `taza.opt.glb`, café subiendo, plato y detalles |
| `geometries.ts` / `textures.ts` | Formas y texturas hechas por código |
| `quality.ts` | Menos partículas/polígonos en móvil |

## Volver a la escena anterior
`NEXT_PUBLIC_HERO_ENGINE=legacy` en `.env.local` (usa `hero-model.tsx` y los `.glb` originales).
