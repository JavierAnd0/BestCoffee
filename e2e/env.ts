/**
 * Modo de datos de la suite. El CI corre el front con USE_MOCKS=true y SIN
 * backend, así que lo que solo el backend real puede comprobar (cupones,
 * contraseñas, preferencias guardadas) se salta ahí de forma explícita.
 *
 * Para la suite completa: levantar el backend con la demo sembrada y correr
 * `pnpm test:e2e` sin USE_MOCKS en el entorno.
 *
 * `admin-real-api.spec.ts` maneja el panel /admin contra la API real. Necesita
 * el front sin mocks apuntando a esa API y estas variables (nunca en el repo):
 *   PLAYWRIGHT_TEST_BASE_URL  host de la tienda, p. ej. http://demo.localhost:3201
 *   E2E_API_URL               API real (por defecto http://localhost:3002)
 *   E2E_TENANT_SLUG           tienda del host (por defecto demo)
 *   E2E_JWT_SECRET            JWT_SECRET del backend (firma la sesión de operador)
 *   E2E_OPERATOR_ID / E2E_OPERATOR_EMAIL  operador dueño de esa tienda
 *   E2E_INTERNAL_SECRET       REVALIDATE_SECRET del backend (pedido de invitado)
 * Sin ellas, o con USE_MOCKS=true, la suite se omite.
 */
export const MOCKS = process.env.USE_MOCKS === "true";

export const NEEDS_BACKEND = "Requiere el backend real con la demo sembrada (no corre en modo mocks).";

export const REAL_API = {
  apiUrl: process.env.E2E_API_URL || "http://localhost:3002",
  tenant: process.env.E2E_TENANT_SLUG || "demo",
  jwtSecret: process.env.E2E_JWT_SECRET ?? "",
  operatorId: process.env.E2E_OPERATOR_ID ?? "",
  operatorEmail: process.env.E2E_OPERATOR_EMAIL ?? "",
  internalSecret: process.env.E2E_INTERNAL_SECRET ?? "",
};

/** Variables obligatorias que faltan para la suite contra la API real ("" si ninguna). */
export const REAL_API_MISSING = [
  ["E2E_JWT_SECRET", REAL_API.jwtSecret],
  ["E2E_OPERATOR_ID", REAL_API.operatorId],
  ["E2E_OPERATOR_EMAIL", REAL_API.operatorEmail],
]
  .filter(([, v]) => !v)
  .map(([k]) => k)
  .join(", ");
