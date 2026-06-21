"use server";

import { cookies } from "next/headers";
import { env } from "../env";

export type MpConnectResult =
  | { url: string }
  | { error: string };

export async function mpConnectAction(): Promise<MpConnectResult> {
  const store = await cookies();
  const token =
    store.get("bestcoffee-session")?.value ??
    store.get("customer_token")?.value;

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/mercadopago/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": env.defaultTenantSlug,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }

  if (!res.ok) {
    let message = "Error al iniciar la conexión con MercadoPago.";
    try {
      const data = (await res.json()) as { message?: string };
      if (typeof data.message === "string") message = data.message;
    } catch { /* ignore */ }
    return { error: message };
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) return { error: "El servidor no devolvió una URL de autorización." };
  return { url: data.url };
}
