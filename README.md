# Bestkofi · Front

Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui. Multi-tenant via subdomain.

Backend (NestJS) vive en otro repo: `BestCoffee-api`.

## Setup

```bash
pnpm install
cp .env.example .env.local   # ajustar NEXT_PUBLIC_API_URL si el backend ya está arriba
pnpm dev
```

URLs locales:
- Platform landing: `http://localhost:3000`
- Storefront ORÍGEN: `http://origen.localhost:3000`
- Admin: `http://origen.localhost:3000/admin`

Los subdominios `*.localhost` resuelven a 127.0.0.1 sin tocar `/etc/hosts`.

## Arquitectura

```
proxy.ts            → resuelve subdomain → x-tenant-slug header
app/(storefront)/   → tienda cliente
app/admin/          → panel admin
app/platform/       → landing SaaS multi-tenant

lib/api/            → cliente HTTP tipado (openapi-fetch + openapi-typescript)
lib/data/           → adaptadores: hoy → mocks, mañana → API. Un solo punto de swap.
lib/mocks/          → fixtures de desarrollo
lib/types.ts        → tipos de dominio compartidos
```

## Conexión con el backend

El front consume el API via `lib/api/client.ts` (`apiServer()` en RSC, `apiClient()` en client components). Headers que se atacan automáticamente: `X-Tenant-Slug` y `Authorization: Bearer ...`.

### Flujo: conectar un endpoint nuevo

1. **Backend** publica `/v1/X` y lo expone en `/v1/docs-json` (Swagger).
2. **Front** regenera los tipos:
   ```bash
   API_URL=https://bestcoffee-api.vercel.app pnpm api:types
   ```
3. Edita `lib/data/<domain>.ts` y reemplaza el cuerpo de la función:
   ```ts
   // antes
   export async function listProducts() {
     if (env.useMocks) return PRODUCTS;
     throw new Error("...");
   }
   // después
   export async function listProducts() {
     const api = await apiServer();
     const { data, error } = await api.GET("/v1/products");
     if (error) throw new Error("API products list failed");
     return data.items;
   }
   ```
4. Las páginas no cambian — ya consumen `lib/data/*`.

### Flag global de mocks

`USE_MOCKS=true` (default en dev) hace que las funciones de `lib/data/*` devuelvan los fixtures de `lib/mocks/`. Una vez todos los endpoints estén wireados, cambia a `USE_MOCKS=false` y quita los branches `env.useMocks` de cada adapter.

## Variables de entorno

Ver `.env.example`. En producción, configurar en Vercel project settings.

| Var | Server | Client | Notas |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✓ | ✓ | URL pública del backend |
| `API_URL_INTERNAL` | ✓ | — | Opcional, para VPC |
| `USE_MOCKS` | ✓ | — | true mientras no haya backend |
| `REVALIDATE_SECRET` | ✓ | — | Compartido con backend para `/api/revalidate` |
| `AUTH_SECRET` | ✓ | — | Compartido con backend para verificar JWT |

## Scripts

```bash
pnpm dev           # next dev (Turbopack)
pnpm build         # next build
pnpm api:types     # regenera lib/api/types.ts desde el OpenAPI del backend
pnpm lint          # eslint
```

## Despliegue

Vercel, proyecto `bestcoffee`, conectado a este repo: cada push a `main` despliega a
producción y cada PR genera una vista previa. Producción actual:
https://bestcoffee-nine.vercel.app (solo la tienda demo ORÍGEN, hasta tener dominio propio).

**Un solo front para todas las tiendas.** La tienda se resuelve por dominio en
`proxy.ts`: `<slug>.<NEXT_PUBLIC_PLATFORM_DOMAIN>` es una tienda, el dominio raíz es
la landing de la plataforma, y cualquier otro host sirve `DEFAULT_TENANT_SLUG`.
Un front dedicado por cliente es la excepción (ver `STARTER_TEMPLATE.md`).

Variables obligatorias en producción (el arranque falla si faltan): `AUTH_SECRET`,
`REVALIDATE_SECRET`, `NEON_AUTH_COOKIE_SECRET`, `PLATFORM_OWNER_EMAIL`.

### Pruebas e2e

`pnpm test:e2e` corre Playwright. En CI el front usa `USE_MOCKS=true` sin backend, y
lo que solo el backend real puede comprobar se omite de forma explícita (ver
`e2e/env.ts`). Para la suite completa, levantar el backend con la demo sembrada y
correr sin `USE_MOCKS` en el entorno.

`e2e/admin-real-api.spec.ts` maneja el panel `/admin` en el navegador contra la API
real (productos, cupones, pedidos, configuración, reseñas). Con el front sin mocks
apuntando a una API con base de pruebas (nunca producción):

```bash
PLAYWRIGHT_TEST_BASE_URL=http://demo.localhost:3201 E2E_API_URL=http://localhost:3002 \
E2E_JWT_SECRET=<JWT_SECRET del backend> E2E_INTERNAL_SECRET=<REVALIDATE_SECRET del backend> \
E2E_OPERATOR_ID=<id del dueño de demo> E2E_OPERATOR_EMAIL=<su correo> \
pnpm exec playwright test e2e/admin-real-api.spec.ts
```

Sin esas variables, o con `USE_MOCKS=true`, se omite. Crea datos con nombres únicos,
archiva los productos y borra los cupones al terminar.

El estado del plan hacia producción vive en `docs/PLAN-CIERRE.md` del repo del backend.

