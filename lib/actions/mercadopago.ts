"use server";

import { operatorFetch } from "../api/gateway";

export type MpConnectResult =
  | { url: string }
  | { error: string };

export async function mpConnectAction(): Promise<MpConnectResult> {
  const res = await operatorFetch<{ url?: string }>("/v1/mercadopago/connect", {
    method: "POST",
  });

  if (!res.ok) {
    return { error: res.error || "Error al iniciar la conexión con MercadoPago." };
  }

  if (!res.data?.url) {
    return { error: "El servidor no devolvió una URL de autorización." };
  }

  return { url: res.data.url };
}
