import { cookies } from "next/headers";
import { env } from "../env";

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
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
