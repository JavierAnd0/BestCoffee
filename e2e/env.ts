/**
 * Modo de datos de la suite. El CI corre el front con USE_MOCKS=true y SIN
 * backend, así que lo que solo el backend real puede comprobar (cupones,
 * contraseñas, preferencias guardadas) se salta ahí de forma explícita.
 *
 * Para la suite completa: levantar el backend con la demo sembrada y correr
 * `pnpm test:e2e` sin USE_MOCKS en el entorno.
 */
export const MOCKS = process.env.USE_MOCKS === "true";

export const NEEDS_BACKEND = "Requiere el backend real con la demo sembrada (no corre en modo mocks).";
