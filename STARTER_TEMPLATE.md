# BestCoffee · Starter template (front a medida por cliente)

Este repositorio es a la vez la tienda de referencia (**ORÍGEN**) y la **plantilla
base** para montar el sitio público de cada cliente nuevo de la plataforma.

El modelo es **una tienda por deploy**: clonas este front, lo apuntas al backend
compartido y le dices a qué *tenant* pertenece. Todo el catálogo, pedidos, blog,
contenido y checkout salen de la API; tú solo personalizas el diseño.

> Lo que **no** se reconstruye por cliente: el backend/API, el panel `/admin`
> (gestión de la tienda) y el panel de superadmin. Esos son compartidos.

---

## 1. Crear el tenant primero

Antes de clonar el front, el superadmin crea el tenant en
`/platform/superadmin/tenants/new`:

- **slug** (p. ej. `cafe-roma`) — identifica al tenant en la API
- **tier** (STARTER / PRO / BUSINESS) — define qué funciones expone la API
- **email del dueño** — recibe el correo de bienvenida y accede a `/admin`
- **dominio** (opcional) — p. ej. `caferoma.com`. Registrarlo aquí **habilita CORS
  automáticamente** para ese dominio (ver §5).

---

## 2. Clonar y configurar

```bash
# clona este repo como base del nuevo cliente
git clone <este-repo> cafe-roma-front && cd cafe-roma-front
pnpm install
cp .env.example .env.local
```

Variables mínimas en `.env.local`:

| Variable | Qué es | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend compartido | `https://api.bestcoffee.io` |
| `DEFAULT_TENANT_SLUG` | **slug del tenant de este cliente** | `cafe-roma` |
| `USE_MOCKS` | `false` para usar la API real | `false` |
| `AUTH_SECRET` | debe coincidir con el `JWT_SECRET` del backend | `openssl rand -base64 32` |
| `REVALIDATE_SECRET` | secreto compartido para revalidación ISR | `openssl rand -hex 32` |

`DEFAULT_TENANT_SLUG` es la pieza clave: todas las llamadas a la API mandan ese
valor en el header `X-Tenant-Slug` (ver [`lib/env.ts`](lib/env.ts) y
[`lib/api/client.ts`](lib/api/client.ts)). Con eso, el mismo código sirve a
cualquier tienda según su `.env`.

---

## 3. Cómo el front conoce su tienda

```ts
import { getCurrentTenant } from "@/lib/data/tenant";

const tenant = await getCurrentTenant();
// tenant.tier        → "STARTER" | "PRO" | "BUSINESS"
// tenant.features    → { checkout, subscriptions, blog, gifts, ... }
// tenant.branding    → colores / tipografía (si los usas)
```

`getCurrentTenant()` ([`lib/data/tenant.ts`](lib/data/tenant.ts)) llama a
`GET /v1/tenants/current` y está memoizado por request con `cache()`.

---

## 4. Respetar el plan (tier / features)

El backend **bloquea con 402** lo que el plan no incluye. Tu front debe ocultar o
gatear esas secciones para una UX limpia. Usa el guard ya incluido:

```ts
import { requireFeature } from "@/lib/data/feature-guard";

export default async function CheckoutPage() {
  await requireFeature("checkout"); // redirige si el tier no lo permite
  // ...
}
```

Para ocultar UI condicionalmente, lee `tenant.features.<capacidad>` directo
(ejemplos en [`components/storefront/header.tsx`](components/storefront/header.tsx)
y [`components/storefront/buy-block.tsx`](components/storefront/buy-block.tsx)).

Capacidades por tier (referencia): `GET /v1/platform/tiers`.

---

## 5. Deploy en el dominio del cliente

1. Despliega el front (Vercel / Dokploy / etc.) en el dominio del cliente
   (`caferoma.com`).
2. Asegúrate de que ese dominio esté registrado en el tenant (paso §1) → el
   backend lo permite en CORS automáticamente (lo resuelve desde `TenantDomain`,
   ver `src/main.ts` del backend, con caché de ~60 s).
3. Si el front vive en un dominio que **no** está en el tenant, agrégalo a
   `CORS_EXTRA_ORIGINS` (CSV) en el backend como alternativa.

---

## 6. Qué puedes personalizar libremente

- Layout, secciones, tipografía, animaciones — es tu código.
- Los **datos** (productos, precios, blog, bloques de contenido HERO/anuncios) los
  edita el dueño desde `/admin`; tú los consumes vía `lib/data/*`.
- Endpoints públicos disponibles: productos, colecciones, contenido, blog,
  reseñas (PRO+), carrito y checkout (PRO+), suscripciones (PRO+).

---

## Checklist para un cliente nuevo

- [ ] Tenant creado en superadmin (slug, tier, dueño, dominio)
- [ ] Repo clonado + `.env.local` con `DEFAULT_TENANT_SLUG` y `NEXT_PUBLIC_API_URL`
- [ ] `USE_MOCKS=false`
- [ ] Diseño personalizado
- [ ] Gating de features respetado (`requireFeature` en rutas premium)
- [ ] Deploy en el dominio del cliente
- [ ] Dominio registrado en el tenant (CORS) o en `CORS_EXTRA_ORIGINS`
