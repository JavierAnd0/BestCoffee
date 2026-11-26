---
name: Bestkofi
description: Tienda editorial de café de especialidad: crema de papel, tinta espresso y un acento terracota que cada cafetería firma como suyo.
colors:
  paper-cream: "#faf7f1"
  card-cream: "#fdf9f4"
  roast-ink: "#170d04"
  parchment-muted: "#ede5d8"
  cream-mid: "#f0e4d0"
  cream-dark: "#e5d5be"
  terracotta: "#b85c32"
  signal-red: "#b54129"
  espresso-deep: "#110602"
  espresso-glow: "#341509"
  hero-cream: "#f7efe4"
  hero-copper: "#e09f67"
  hero-caramel: "#e8b888"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.2vw, 4.6rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2rem, 4.5vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.005em"
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  sm: "2px"
  md: "3px"
  lg: "6px"
  pill: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  section-y: "96px"
components:
  button-primary:
    backgroundColor: "{colors.roast-ink}"
    textColor: "{colors.paper-cream}"
    rounded: "{rounded.pill}"
    padding: "16px 28px"
  button-primary-hover:
    backgroundColor: "{colors.roast-ink}"
  button-outline:
    backgroundColor: "{colors.paper-cream}"
    textColor: "{colors.roast-ink}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  card:
    backgroundColor: "{colors.card-cream}"
    textColor: "{colors.roast-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.paper-cream}"
    textColor: "{colors.roast-ink}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  chip:
    backgroundColor: "{colors.parchment-muted}"
    textColor: "{colors.roast-ink}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
---

# Design System: Bestkofi

## Overview

**Creative North Star: "La Tostaduría Editorial"**

Una revista de café impresa que se vende sola. Papel crema, tinta espresso, una serifa elegante a gran tamaño y un único acento terracota. Es un sistema sereno y premium: mucho aire, pocas cosas a la vez, jerarquía por escala y peso de la tipografía y no por cajas, colores ni efectos. El café es el protagonista; la interfaz se aparta.

La plataforma es multi-tienda, así que el sistema tiene dos capas. **La estructura es de Bestkofi** (crema, espresso, tipografía, hairlines, ritmo) y **el acento es de cada cafetería**: `--accent` lo sobrescribe el color de marca de la tienda y todo lo que sea énfasis (foco, indicadores, detalles) lo hereda. La escena 3D del hero y su paleta oscura son propias de la tienda demo ORÍGEN, no del sistema.

**Key Characteristics:**
- Crema cálido como superficie dominante; espresso como tinta y como escenario oscuro (hero y pie de página).
- Un solo acento, terracota por defecto, intercambiable por tienda.
- Serifa display ligera (Cormorant Garamond) frente a un sans sobrio (DM Sans) con etiquetas en mayúsculas espaciadas.
- Plano y tónico: hairlines y cambios de crema en lugar de sombras en reposo.
- Esquinas casi rectas en el contenido; píldora solo en el llamado a la acción principal.
- Español de Colombia y precios en COP; diseño móvil primero.

## Colors

Una paleta cálida y mate de papel y café tostado: la crema domina, el espresso entinta, el terracota es la única voz de color.

### Primary
- **Tinta Espresso** (`#170d04`): texto, botones primarios, barra de anuncios y bordes de énfasis. Es el "negro" del sistema: nunca se usa `#000`.

### Secondary
- **Terracota Tostado** (`#b85c32`): el acento de marca (`--accent`). Foco de teclado (contorno de 2 px), indicadores de estado y pequeños acentos tipográficos. Es el valor por defecto y lo reemplaza el color de cada tienda.

### Neutral
- **Papel Crema** (`#faf7f1`): fondo de página.
- **Crema de Tarjeta** (`#fdf9f4`): superficie de tarjetas y popovers, apenas más clara que el papel.
- **Pergamino** (`#ede5d8`): fondos tenues, chips y estados deshabilitados.
- **Crema Media** (`#f0e4d0`) y **Crema Oscura** (`#e5d5be`): bandas de sección y rellenos editoriales.
- **Rojo de Alerta** (`#b54129`): errores y acciones destructivas; solo para eso.
- **Líneas:** la tinta espresso al 8 % (`--line`) para hairlines y al 18 % (`--line-strong`) para énfasis.
- **Texto atenuado:** espresso al 52 % (`--muted-foreground`).

### Escenario oscuro (hero y pie)
- **Espresso Profundo** (`#110602`) con halo **Brasa** (`#341509`): fondo del hero oscuro y del pie de página.
- **Crema de Hero** (`#f7efe4`), **Cobre** (`#e09f67`) y **Caramelo** (`#e8b888`): texto y acentos sobre fondo oscuro. Son tintes cálidos, no blancos ni grises.

### Named Rules
**The One Voice Rule.** El acento aparece en menos del 10 % de cualquier pantalla. Su escasez es lo que lo hace leer como marca.

**The Tinted Neutral Rule.** Ningún neutro es gris puro: todo lleva calidez de café. Ni `#000` ni `#fff`; el blanco real de una superficie es la crema.

**The Tenant Accent Rule.** Toda pieza que use énfasis de color lo toma de `--accent`, nunca de un hex fijo. Así una tienda con otro color de marca no hereda terracota por accidente.

## Typography

**Display Font:** Cormorant Garamond (con Georgia, serif)
**Body Font:** DM Sans (con ui-sans-serif, system-ui)
**Label/Mono Font:** DM Sans en mayúsculas espaciadas; monoespaciada del sistema solo en las etiquetas técnicas del hero.

**Carácter:** Una serifa de contraste alto, ligera y elegante, frente a un sans neutro y legible. La serifa habla; el sans informa. Las cursivas de Cormorant se reservan para el énfasis emocional dentro de un titular ("grano a grano").

### Hierarchy
- **Display** (300, `clamp(2.6rem, 5.2vw, 4.6rem)`, 0.95): titulares del hero y aperturas de sección. Tracking `-0.025em` con ligaduras y kerning activos.
- **Headline** (600, `clamp(2rem, 4.5vw, 3.5rem)`, 1.05): títulos de página (catálogo, ficha de producto, blog).
- **Title** (600, 1.5rem, 1.2): títulos de tarjeta, sección y diálogo, siempre en serifa.
- **Body** (400, 1rem, 1.6): texto corrido en DM Sans, con `0.005em` de tracking. Líneas de 65 a 75 caracteres.
- **Label** (500, 0.6875rem, `0.18em`, mayúsculas): eyebrows, etiquetas de producto, "TUESTE 5/9", metadatos. Siempre pequeñas y siempre espaciadas.

### Named Rules
**The Serif-Speaks Rule.** Los titulares son siempre serifa; el sans nunca titula. La excepción son las etiquetas en mayúsculas, que no son titulares.

**The Small-Caps-Label Rule.** Toda etiqueta de apoyo usa el mismo patrón: 11 px, mayúsculas, tracking 0.16–0.18 em. No se inventan otros estilos de etiqueta.

## Layout

Contenedor de 80 rem (`max-w-7xl`) centrado, con márgenes laterales de 16 px en móvil, 24 px en tablet y 32 px en escritorio. Las secciones editoriales del inicio usan márgenes más generosos (hasta 96 px en pantallas grandes) y relleno vertical amplio (96–128 px) para dejar respirar. El texto largo se acota a 48 rem (`max-w-3xl`).

El diseño es móvil primero: una columna, navegación inferior fija con acciones principales y menú lateral; en escritorio pasa a cabecera de tres zonas (navegación, logotipo centrado, acciones) y rejillas de 2 a 12 columnas. El catálogo y la ficha de producto usan rejillas asimétricas (una pieza grande y tres pequeñas) en lugar de cuadrículas uniformes.

El ritmo es editorial: bloques separados por aire y por una línea fina, no por cajas.

## Elevation & Depth

Plano y tónico. La profundidad se transmite con hairlines (borde espresso al 8 %) y con el paso entre papel, crema de tarjeta y crema media; el contenido no lleva sombra en reposo. La sombra aparece solo como respuesta o en lo que flota sobre la página.

### Shadow Vocabulary
- **Reposo sutil** (`shadow-xs`): único caso en reposo, para un bloque de compra que debe separarse del fondo.
- **Flotante** (`shadow-md` a `shadow-xl`): carrito lateral, diálogos, panel de la demo y botones de acción fijos; es decir, lo que está encima del contenido.
- **Anillo de tarjeta** (`ring-1`, espresso al 10 %): sustituye a la sombra en las tarjetas.

### Named Rules
**The Flat-At-Rest Rule.** Una superficie en reposo no proyecta sombra. Si algo sube, es porque el usuario lo activó o porque flota.

## Shapes

Lenguaje contenido: esquinas casi rectas (2–3 px) en el contenido editorial, 6 px en tarjetas y campos, y píldora completa solo en el llamado a la acción principal y en los chips. Las imágenes de producto son rectángulos de 2 px, con un degradado de tueste detrás cuando no hay foto. Los bordes son hairlines; no hay contornos gruesos ni marcos decorativos.

*Observación del código:* el repositorio mezcla `rounded-md`, `rounded-lg`, `rounded-xl` y `rounded-full` sin una regla estricta; el radio base declarado es de 3 px. La intención confirmada es contenida; las tarjetas y el botón por defecto con radio mayor son deuda de consistencia, no precedente.

## Components

### Buttons
- **Shape:** el CTA principal es píldora completa (9999 px); los botones de interfaz (panel, formularios) usan 6 px.
- **Primary:** espresso con texto crema. El CTA editorial es grande (padding 16 × 28 px), en mayúsculas de 12 px con tracking 0.18 em y una flecha que se desplaza al pasar el cursor. Lleva `active` con desplazamiento de 1 px.
- **Hover / Focus:** hover atenúa el fondo al 80 %; foco de teclado con contorno de 2 px en el acento y separación de 2 px. Nunca se elimina el foco.
- **Outline / Secondary / Ghost:** fondo crema con hairline, pergamino al hover; el destructivo es rojo al 10 % de opacidad con texto rojo.

### Chips
- **Style:** pergamino con texto espresso, altura de 20 px, forma de píldora.
- **State:** las insignias de producto ("Comercio justo", "Nuevo") van en minúsculas pequeñas dentro del chip; el fondo oscuro con texto claro se reserva para insignias sobre imagen.

### Cards / Containers
- **Corner Style:** 6 px.
- **Background:** crema de tarjeta sobre el papel.
- **Shadow Strategy:** ninguna; anillo de 1 px al 10 %.
- **Border:** hairline cuando hace falta separar; el contenido de producto no lleva marco.
- **Internal Padding:** 16 px.

### Inputs / Fields
- **Style:** trazo hairline, fondo transparente, esquinas de 6 px, 32 px de alto (más en formularios de compra).
- **Focus:** el borde y un anillo de 3 px toman el acento al 38 %.
- **Error / Disabled:** borde y anillo rojos; deshabilitado al 50 % de opacidad.

### Navigation
- **Style:** cabecera pegajosa, fondo crema al 97 % de opacidad y hairline inferior. Los enlaces usan un relleno espresso que barre desde la izquierda al pasar el cursor, con el texto invirtiéndose a crema.
- **Sobre el hero oscuro:** la cabecera se vuelve transparente con degradado y letra clara mientras la escena está pegada arriba.
- **Móvil:** menú lateral y barra inferior fija de acciones.
- **Barra de anuncios:** espresso con texto crema en mayúsculas pequeñas de 12 px.

### Ficha y tarjeta de producto (componente distintivo)
La tarjeta no es un contenedor: es una imagen con un degradado de tueste (más oscuro cuanto más tostado, gris acero para accesorios), un halo cálido en el centro y una etiqueta pequeña en mayúsculas. Entra con un fundido y un ascenso de 28 px una sola vez. El **indicador de tueste** (nueve cajitas de 10 × 8 px llenas hasta el nivel) es la firma gráfica del producto.

### Panel de la demo (componente distintivo)
Barra inferior que dice qué es ("Arma tu tienda · por Bestkofi"), muestra el plan que cubre lo armado en serifa ("Plan Tienda · 8 de 8 encendidas") y ofrece dos pasos: "Ajustar" (borde hairline, 6 px) y "Quiero esta tienda" (la píldora espresso, único CTA de peso). Plegada deja la home completa; en móvil se apoya sobre la barra de navegación inferior y desde `lg` se ancla abajo a la derecha. "Ajustar" la despliega hacia arriba con presets en una fila, interruptores agrupados por Presencia y Tienda, y un aviso tonal bajo la fila tocada con "Deshacer" y "Ver el sitio". El resumen y el CTA no desaparecen al desplegar. Es lo que ve el dueño de cafetería al evaluar la plataforma, así que debe sentirse tan cuidado como la tienda a la que se superpone.

## Panel de administración (herramienta neutra)

El admin (`/admin`) es una herramienta de trabajo, no una revista: decisión del dueño del producto (2026-11-26) tras una critique que midió el texto atenuado en 3,8:1. Conserva la paleta crema y espresso, pero cambia la tipografía. Las reglas viven en `app/globals.css` bajo `body:has(.admin-ui)`, para que también las hereden diálogos y menús.

- **Una sola familia:** DM Sans con rango de peso 300–700 (`--font-ui`), así las seminegritas son reales. `font-display` dentro del admin resuelve a DM Sans; la serifa no titula en el panel.
- **Texto atenuado:** espresso al 68 % (≈6,5:1 sobre crema). Nunca por debajo de 4,5:1.
- **Piso de tamaño:** 13 px (`text-xs` vale 13 px en el admin); datos y cuerpo a 14 px. Sin 10–11 px.
- **Etiquetas:** `.admin-label` (13 px, 500, tinta, minúsculas) para campos de formulario y `.admin-th` (13 px, 500, atenuado) para encabezados de tabla. Las etiquetas en mayúsculas espaciadas son de la tienda, no del panel.
- **Títulos de página:** 24 px, 600, vía `PageHeader`.
- **Excepción:** lo que previsualiza contenido de la tienda (editor del blog) y el logotipo de la tienda usan `font-editorial`, que conserva la serifa original.

## Do's and Don'ts

### Do:
- **Do** usar el espresso (`#170d04`) como tinta y crema (`#faf7f1`) como papel; todo neutro lleva calidez.
- **Do** tomar el énfasis siempre de `--accent`, para que cada tienda firme con su color.
- **Do** titular en serifa Cormorant Garamond, ligera (300) en el display y semiaudaz (600) en títulos de página.
- **Do** separar con aire y con hairlines al 8 %, no con cajas ni sombras.
- **Do** mantener las etiquetas de apoyo en el patrón único: 11 px, mayúsculas, tracking 0.16–0.18 em.
- **Do** reservar la píldora para el CTA principal y los chips; el resto es casi recto (2–6 px).
- **Do** diseñar primero para móvil y en español de Colombia, con precios en COP.
- **Do** respetar `prefers-reduced-motion` (ya hay una regla global que reduce animaciones a casi cero).

### Don't:
- **Don't** parecer una plantilla genérica de SaaS: nada de degradados morados, iconos en círculos de colores ni paneles azules de plantilla.
- **Don't** caer en la cafetería clichê: sin granos de café como fondo repetido, tipografía de pizarra ni sepia nostálgico.
- **Don't** recargar: un solo acento, pocas animaciones y ningún efecto que compita con el producto.
- **Don't** volverlo frío o corporativo: sin grises azulados ni esquinas duras que no se sientan a café.
- **Don't** usar `#000` ni `#fff`, ni un hex fijo de terracota donde corresponde `--accent`.
- **Don't** poner sombras a superficies en reposo ni desenfoques de fondo en elementos que se desplazan: encarecen el scroll.
- **Don't** mostrar reseñas, cifras o testimonios que no sean reales.
- **Don't** extender la escena 3D ni su paleta oscura a otras tiendas: son identidad de la demo ORÍGEN.
