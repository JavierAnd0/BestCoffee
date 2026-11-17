// IP del visitante, firmada, para los límites por IP de la API.
//
// La tienda llama a la API desde el servidor de Next, así que la API ve siempre
// la IP del servidor: sin esto, los límites por IP (5 inicios de sesión/min,
// 5 reseñas/min…) serían uno solo para todos los visitantes de la tienda.
// El servidor firma la IP con el secreto compartido (REVALIDATE_SECRET) y la API
// solo la acepta con firma válida (ver `client-ip-signature.ts` en el backend).
//
// Solo para código de servidor: usa node:crypto y el secreto.

import { createHmac } from "node:crypto";
import { env } from "../env";

function sign(ip: string, ts: string): string {
  return createHmac("sha256", env.revalidateSecret).update(`${ts}.${ip}`).digest("hex");
}

/** Primera IP de `x-forwarded-for` (la pone el proxy de la plataforma, p. ej. Vercel) o `x-real-ip`. */
export function clientIpFrom(h: { get(name: string): string | null }): string | null {
  const xff = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = xff || h.get("x-real-ip")?.trim() || "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : null;
}

/** Cabeceras firmadas para una IP concreta (o vacía = sin visitante). */
export function signedClientIpHeaders(ip: string | null): Record<string, string> {
  if (!env.revalidateSecret) return {};
  const value = ip ?? "";
  // Sin visitante la firma es constante ("0"): no rompe la caché de fetch de Next.
  const ts = value ? String(Math.floor(Date.now() / 1000)) : "0";
  return {
    "x-client-ip": value,
    "x-client-ip-ts": ts,
    "x-client-ip-sig": sign(value, ts),
  };
}

/**
 * Cabeceras con la IP del visitante de la petición en curso. Fuera de una
 * petición (render en segundo plano) firma "sin visitante".
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  let ip: string | null = null;
  try {
    const { headers } = await import("next/headers");
    ip = clientIpFrom(await headers());
  } catch {
    // Fuera del ámbito de una petición.
  }
  return signedClientIpHeaders(ip);
}

/** Para lecturas cacheadas compartidas por todos los visitantes. */
export function serverOriginHeaders(): Record<string, string> {
  return signedClientIpHeaders(null);
}
