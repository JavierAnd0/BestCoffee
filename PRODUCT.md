# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primario: dueños de cafeterías y tostadores de café de especialidad en Colombia.** Son quienes evalúan y contratan BestCoffee. Su trabajo: tener su negocio en línea sin construir un sitio aparte, mostrar y vender su café, y administrar catálogo, pedidos y suscripciones desde un panel (`/admin`). Los evalúan primero mirando el demo y su panel; deciden qué servicios activar y cuánto pagar.

**Secundario: compradores de cada tienda.** Quien compra café en el sitio de una cafetería concreta (storefront). Llegan sobre todo desde el celular (confirmado: el diseño es móvil primero).

**Operador de la plataforma (superadmin).** Crea tiendas, asigna planes, activa o apaga funciones, gestiona dominios, marca y cobro. Es el propio autor del producto; no es el usuario por el que se diseña primero.

## Product Purpose

Plataforma multi-tienda (SaaS) para cafeterías y tostadores: un backend compartido que da catálogo, pedidos, pagos, suscripciones, blog y cuentas de cliente, con un front que cada tienda personaliza. Existe para que una cafetería contrate solo lo que necesita (desde una landing hasta una tienda completa con pedidos y pagos en línea) y crezca sin migrar de plataforma. Éxito: una cafetería ve el demo, arma su tienda encendiendo o apagando servicios, y contrata el plan que corresponde a su negocio.

## Positioning

Lo que otra plataforma no podría copiar con verdad (palabras del usuario, confirmadas): la estructura del backend ya está resuelta y el front es personalizable según el cliente; cada cafetería paga por lo que quiere y puede escalar a medida que su negocio y sus necesidades crecen. En la práctica: servicios modulares (landing, catálogo, pedidos, pagos en línea, cuentas, suscripciones, blog, cupones, reseñas, regalos) sobre una misma plataforma, activables por tienda.

## Operating Context

- Un solo front compartido sirve a todas las tiendas y resuelve la tienda por dominio (`<slug>.<dominio>` o dominio propio verificado). Un front a medida por cliente existe como opción de pago aparte, no como modelo por defecto.
- Planes: STARTER (presencia: landing, blog y catálogo de solo lectura), PRO (pedidos, cuentas de cliente, suscripciones, cupones, reseñas) y BUSINESS (regalos, dominio propio, sin límite de productos). El superadmin puede cambiar funciones sueltas por tienda.
- El cobro a la tienda (suscripción, pago único con mantenimiento, o comisión sobre ventas) es un acuerdo comercial manejado a mano; no hay pasarela de cobro de la plataforma.
- Una tienda sin pagos en línea recibe pedidos y cobra por fuera (transferencia o contra entrega); el operador los marca como pagados.
- Existe una tienda demo (`demo`) con un panel "Arma tu tienda": el visitante enciende y apaga funciones y ve el sitio cambiar; el estado es solo suyo y el demo nunca cobra.

## Capabilities and Constraints

- Stack del front (existente): Next.js 16 (App Router), React 19, Tailwind 4, three.js para la escena 3D del hero de la demo. Backend aparte en NestJS + Prisma + Postgres (Neon).
- Idioma y mercado: español de Colombia, precios en pesos colombianos (COP), direcciones y ciudades de Colombia. MercadoPago es la pasarela de las tiendas; Stripe no se ofrece a tiendas reales hasta implementar Connect.
- Móvil primero: el diseño debe funcionar en pantallas pequeñas antes que en escritorio.
- La marca de cada tienda (logo, color de acento, lema, contacto, datos legales) sale de su configuración, no del código. Un campo no cargado se omite; nunca se rellena con datos de otra marca.
- Las páginas editoriales (historia, impacto, sostenibilidad, mayoristas, sedes) existen solo para las tiendas que tienen su propio contenido.
- Sin decidir: dominio propio de la plataforma (aún no hay), nombre comercial definitivo para la oferta, y precios de los planes.

## Brand Commitments

- **BestCoffee** es el nombre de la plataforma. Cada cafetería pone su propia identidad en su tienda.
- **ORÍGEN** es solo la tienda demo (datos ficticios, hero 3D propio); no es la identidad de la plataforma ni de ninguna cafetería real.
- Texto de interfaz en español colombiano.

## Evidence on Hand

- Una tienda demo funcional con catálogo, blog, cupones y las funciones de cada plan (datos de ejemplo, no reales).
- No hay clientes de pago, testimonios, casos de estudio, cifras de uso ni reseñas reales. El trabajo futuro no debe inventarlos (confirmado): la ficha de producto aún muestra "5 estrellas, 128 reseñas" escrito a mano, que es una excepción por corregir, no un precedente.
- Los datos fiscales y de contacto de ORÍGEN (NIT, razón social, correos) son ficticios.

## Product Principles

1. **El dueño de la cafetería es quien decide.** El producto se diseña para que alguien que no es técnico entienda qué activa, qué cambia y qué paga, sin construir nada.
2. **Cada tienda es suya.** La plataforma aporta estructura; la identidad, el contenido y los datos de contacto son de la cafetería y nunca se mezclan entre tiendas.
3. **Modular y honesto.** Una función apagada desaparece por completo (menús, páginas, API) y una función no disponible lo dice con claridad; nada se promete ni se muestra de más.
4. **Solo pruebas reales.** Sin reseñas, clientes ni cifras inventadas; cuando no hay dato, se omite.
5. **Móvil y Colombia desde el principio.** Español de Colombia, COP y pantallas pequeñas son el caso base, no una adaptación posterior.

## Accessibility & Inclusion

Sin estándar formal establecido. Lectores de pantalla y teclado deben poder usar los flujos de compra y el panel; el indicador de carga del hero ya se diseñó para no leerse por porcentaje. Pendiente decidir un objetivo explícito (por ejemplo WCAG AA).
