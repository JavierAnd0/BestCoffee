// Helper para llamar endpoints /v1/platform/* desde Server Components.
// No usa el cliente openapi-fetch tipado porque los endpoints de plataforma
// no están en el schema generado.
import { env } from "../env";

async function getToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const c = await cookies();
  return c.get("bestcoffee-session")?.value ?? null;
}

function buildHeaders(token: string | null, extra?: Record<string, string>) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return { ...h, ...extra };
}

export async function platformFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${env.apiUrlInternal}${path}`, {
    ...options,
    headers: buildHeaders(token, options?.headers as Record<string, string>),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Platform API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Versión client-side (usa cookie directamente como header — el browser la envía)
export async function platformFetchClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
