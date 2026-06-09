// ─────────────────────────────────────────────────────────────────────────────
// Typed API client for the backend (NestJS @ bestcoffee-api).
// Uses openapi-fetch with the generated `paths` from lib/api/types.ts.
//
// The middleware auto-attaches:
//   • X-Tenant-Slug   resolved from request headers in Server Components,
//                     or falls back to "origen" in dev so client components
//                     work without explicitly passing it.
//   • Authorization   Bearer <jwt>, when a session is available.
//
// Two factories:
//   • apiServer()  — for Server Components / Route Handlers / Server Actions.
//                    Reads headers() to resolve tenant + session.
//   • apiClient()  — for client components. Tenant comes from a data-attr
//                    set by the storefront layout; auth from a cookie.
// ─────────────────────────────────────────────────────────────────────────────

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./types";
import { env } from "../env";

// Build a middleware that attaches the two headers every call needs.
function attachHeaders(getTenant: () => string | null, getToken: () => string | null): Middleware {
  return {
    async onRequest({ request }) {
      const tenant = getTenant();
      if (tenant && !request.headers.has("x-tenant-slug")) {
        request.headers.set("x-tenant-slug", tenant);
      }
      const token = getToken();
      if (token && !request.headers.has("authorization")) {
        request.headers.set("authorization", `Bearer ${token}`);
      }
      return request;
    },
  };
}

// ── Server factory ──────────────────────────────────────────────────────────
// Use inside Server Components, Route Handlers, and Server Actions:
//   const api = await apiServer();
//   const { data, error } = await api.GET('/v1/products');
export async function apiServer() {
  // Lazy-import next/headers so this module can also be bundled for client
  // components without dragging the server-only API in.
  const { headers, cookies } = await import("next/headers");
  const h = await headers();
  const c = await cookies();

  const tenant = h.get("x-tenant-slug") ?? "origen";
  const token = c.get("bestcoffee-session")?.value ?? null;

  // Prefer the internal URL when the front is colocated with the API in a
  // VPC; the public URL works everywhere.
  const baseUrl = env.apiUrlInternal;

  const client = createClient<paths>({ baseUrl });
  client.use(attachHeaders(() => tenant, () => token));
  return client;
}

// ── Client factory ──────────────────────────────────────────────────────────
// Use inside "use client" components for live mutations (carrito, quiz, etc.):
//   const api = apiClient();
//   const { data, error } = await api.POST('/v1/cart/items', { body: ... });
export function apiClient() {
  const baseUrl = env.apiUrl;
  const client = createClient<paths>({ baseUrl });
  client.use(
    attachHeaders(
      // Tenant from <html data-tenant> set by storefront layout; falls back to
      // origen so dev works without subdomain.
      () => {
        if (typeof document === "undefined") return null;
        return document.querySelector("[data-tenant]")?.getAttribute("data-tenant") ?? "origen";
      },
      // Token from a non-HttpOnly cookie mirror; in production we may move this
      // to an Authorization header set by middleware on every request.
      () => {
        if (typeof document === "undefined") return null;
        const m = document.cookie.match(/(?:^|;\s*)bestcoffee-token=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : null;
      },
    ),
  );
  return client;
}
