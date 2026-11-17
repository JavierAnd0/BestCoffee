import { cookies } from "next/headers";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import { getOperatorSession } from "./session-store";
import { clientIpHeaders } from "@/lib/api/client-ip";

/**
 * ¿Hay un operador REAL autenticado? Comprueba el token contra el backend
 * (`/v1/auth/me` verifica la firma y la vigencia del JWT). Basta con que exista
 * la cookie NO es suficiente: cualquiera puede escribir una cookie a mano.
 *
 * Para acciones del front que no pasan por el backend (p. ej. subir o borrar
 * archivos en Vercel Blob con el token de la plataforma).
 */
export async function hasValidOperatorSession(): Promise<boolean> {
  const c = await cookies();
  const token =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value ??
    null;
  if (!token) return false;
  // Modo de datos simulados (solo desarrollo/CI): no hay backend que consultar.
  if (env.useMocks) return true;
  // Sesiones locales sin firma nunca valen para operar sobre almacenamiento.
  if (token.endsWith(".local_operator_session")) return false;

  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/me`, {
      headers: { ...(await clientIpHeaders()), Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Tienda sobre la que el operador puede subir o borrar archivos en Vercel Blob.
 * La confirma el backend (miembro con permiso de edición de la tienda del host):
 * un token válido de otra tienda no basta. Devuelve null si no hay permiso.
 */
export async function operatorStorageTenant(): Promise<string | null> {
  const { token, tenantSlug } = await getOperatorSession();
  if (!token) return null;
  if (env.useMocks) return tenantSlug;
  if (token.endsWith(".local_operator_session")) return null;
  const r = await operatorFetch<{ tenantSlug?: string }>("/v1/admin/products/storage-access");
  const slug = r.ok ? r.data?.tenantSlug : undefined;
  return slug && /^[a-z0-9-]+$/.test(slug) ? slug : null;
}

/** Prefijo de ruta de las imágenes de producto de una tienda en Blob. */
export function productImagePrefix(tenantSlug: string): string {
  return `products/${tenantSlug}/`;
}
