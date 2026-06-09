// Centralized env access. All env reads route through here so a missing var
// fails at module load (server-side) instead of mid-request.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

// Public (exposed to client). Prefix with NEXT_PUBLIC_ for client-side access.
export const env = {
  // API URL — public because the client also calls /v1/* directly from the
  // browser (cart actions, etc.). Server-only API calls use API_URL_INTERNAL
  // when set (e.g. private VPC). Falls back to public.
  apiUrl: optional(
    "NEXT_PUBLIC_API_URL",
    optional("API_URL", "http://localhost:3001"),
  ),
  apiUrlInternal: optional(
    "API_URL_INTERNAL",
    optional("NEXT_PUBLIC_API_URL", "http://localhost:3001"),
  ),

  // Toggle between mock data and live API per request — true while the
  // backend doesn't have the endpoint yet. Set USE_MOCKS=false (or unset
  // after switching) to call the real API.
  useMocks: optional("USE_MOCKS", "true") === "true",

  // Shared secret for backend → front revalidation webhook. Backend sends
  // this in the X-Revalidate-Secret header when an admin edit lands.
  revalidateSecret: optional("REVALIDATE_SECRET", "dev-revalidate-secret"),

  // Used by NextAuth and to verify JWTs issued by the backend. Same value
  // must be set in the API service. In production override with a real
  // 32-byte random secret.
  authSecret: optional("AUTH_SECRET", "dev-auth-secret-replace-in-prod"),

  isDev: process.env.NODE_ENV !== "production",
};

// Lazy `required` for things that must blow up at boot in production but
// can default in dev.
export function requiredEnv(name: string): string {
  if (process.env.NODE_ENV === "production") return required(name);
  return process.env[name] ?? `dev-${name.toLowerCase()}`;
}
