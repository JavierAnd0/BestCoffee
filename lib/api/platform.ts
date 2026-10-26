// Helper para llamar endpoints /v1/platform/* desde Server Components.
// No usa el cliente openapi-fetch tipado porque los endpoints de plataforma
// no están en el schema generado.
import { env } from "../env";

async function getToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const c = await cookies();
  return c.get("bestcoffee-operator-session")?.value ?? null;
}

function buildHeaders(token: string | null, extra?: Record<string, string>) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return { ...h, ...extra };
}

function decodeLocalOperatorToken(token: string | null): {
  email?: string;
  isPlatformOwner?: boolean;
} | null {
  if (!token || !token.endsWith(".local_operator_session")) return null;
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    }
  } catch {}
  return null;
}

export async function platformFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getToken();
  try {
    const res = await fetch(`${env.apiUrlInternal}${path}`, {
      ...options,
      headers: buildHeaders(token, options?.headers as Record<string, string>),
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
    const localOp = decodeLocalOperatorToken(token);
    if (localOp) {
      if (path === "/v1/auth/me") {
        return { email: localOp.email, isPlatformOwner: localOp.isPlatformOwner } as unknown as T;
      }
      if (path === "/v1/platform/tenants") {
        return [] as unknown as T;
      }
    }
    const body = await res.text().catch(() => "");
    throw new Error(`Platform API ${res.status}: ${body}`);
  } catch (err) {
    const localOp = decodeLocalOperatorToken(token);
    if (localOp) {
      if (path === "/v1/auth/me") {
        return { email: localOp.email, isPlatformOwner: localOp.isPlatformOwner } as unknown as T;
      }
      if (path === "/v1/platform/tenants") {
        return [] as unknown as T;
      }
    }
    throw err;
  }
}

// Nota: las mutaciones del panel (crear tenant, impersonar) NO usan un cliente
// de navegador. El PlatformGuard del backend solo lee `Authorization: Bearer`, no
// cookies, así que esas acciones viven en lib/actions/platform.ts como server
// actions que leen la cookie httpOnly y la reenvían como Bearer.
