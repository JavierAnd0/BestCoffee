// Helper para llamar endpoints /v1/platform/* desde Server Components.
// No usa el cliente openapi-fetch tipado porque los endpoints de plataforma
// no están en el schema generado.
import { env } from "../env";
import { clientIpHeaders } from "./client-ip";

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

export async function platformFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getToken();
  try {
    const res = await fetch(`${env.apiUrlInternal}${path}`, {
      ...options,
      headers: {
        ...(await clientIpHeaders()),
        ...buildHeaders(token, options?.headers as Record<string, string>),
      },
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
    const body = await res.text().catch(() => "");
    const err = new Error(`Platform API ${res.status}: ${body}`);
    console.error(`platformFetch(${path}) failed:`, err.message);
    throw err;
  } catch (err) {
    // No ocultar fallos reales del panel de superadmin devolviendo [] en
    // silencio — el caller debe ver y manejar el error (ej. mostrar un
    // estado de error en la UI en lugar de una lista vacía engañosa).
    console.error(`platformFetch(${path}) threw:`, err);
    throw err;
  }
}

// Nota: las mutaciones del panel (crear tenant, impersonar) NO usan un cliente
// de navegador. El PlatformGuard del backend solo lee `Authorization: Bearer`, no
// cookies, así que esas acciones viven en lib/actions/platform.ts como server
// actions que leen la cookie httpOnly y la reenvían como Bearer.
