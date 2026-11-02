import { cookies } from "next/headers";
import { env } from "../env";
import {
  getCustomerSession,
  getOperatorSession,
  setCustomerSessionCookies,
} from "../auth/session-store";

export type GatewayResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string };

interface GatewayRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  persistSyncedSession?: boolean;
}

function extractApiError(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const msg = (json as { message?: unknown }).message;
  if (Array.isArray(msg)) {
    return msg.filter((x) => typeof x === "string").join(". ") || fallback;
  }
  if (typeof msg === "string" && msg.trim().length > 0) {
    return msg;
  }
  return fallback;
}

/**
 * Costura única (Seam) para llamadas autenticadas de cliente hacia el backend NestJS.
 */
export async function customerFetch<T = unknown>(
  path: string,
  init: GatewayRequestInit = {},
): Promise<GatewayResult<T>> {
  const { token, tenantSlug } = await getCustomerSession();

  if (init.persistSyncedSession && token && token !== "mock-session-test") {
    try {
      const store = await cookies();
      const existing = store.get("customer_token")?.value;
      if (existing !== token) {
        setCustomerSessionCookies(store, token);
      }
    } catch {
      // Llamado desde un Server Component donde cookies().set no está permitido
    }
  }

  const reqHeaders: Record<string, string> = {
    "X-Tenant-Slug": tenantSlug,
    ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          Cookie: `customer_token=${token}`,
        }
      : {}),
    ...init.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}${path}`, {
      method: init.method ?? "GET",
      headers: reqHeaders,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No se pudo conectar con el servidor.",
    };
  }

  let json: unknown = null;
  if (res.status !== 204) {
    try {
      json = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: extractApiError(json, "No se pudo completar la operación."),
    };
  }

  return { ok: true, data: json as T, status: res.status };
}

/**
 * Costura única (Seam) para llamadas autenticadas de operador / admin hacia el backend NestJS.
 */
export async function operatorFetch<T = unknown>(
  path: string,
  init: GatewayRequestInit = {},
): Promise<GatewayResult<T>> {
  const { token, tenantSlug } = await getOperatorSession();

  const reqHeaders: Record<string, string> = {
    "X-Tenant-Slug": tenantSlug,
    ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}${path}`, {
      method: init.method ?? "GET",
      headers: reqHeaders,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 503,
      error: "No se pudo conectar con el servidor.",
    };
  }

  let json: unknown = null;
  if (res.status !== 204) {
    try {
      json = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: extractApiError(json, "No se pudo completar la operación en el panel."),
    };
  }

  return { ok: true, data: json as T, status: res.status };
}

