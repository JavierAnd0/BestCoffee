"use server";

import { cookies } from "next/headers";
import QRCode from "qrcode";
import { env } from "../env";
import { clientIpHeaders } from "@/lib/api/client-ip";

/**
 * Verificación en dos pasos del propio operador (panel de tienda y superadmin).
 * Siempre con la sesión propia del operador, nunca con la de suplantación: el
 * dueño de la plataforma viendo una tienda no debe tocar el 2FA de su dueño.
 */

export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function ownSessionToken(): Promise<string | null> {
  const token = (await cookies()).get("bestcoffee-operator-session")?.value ?? null;
  if (!token || token.endsWith(".local_operator_session")) return null;
  return token;
}

async function mfaFetch<T>(path: string, body?: unknown): Promise<Result<T>> {
  if (env.useMocks) {
    return { ok: false, error: "No disponible con datos de ejemplo." };
  }
  const token = await ownSessionToken();
  if (!token) return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/mfa${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(await clientIpHeaders()),
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No pudimos conectar con el servidor. Inténtalo de nuevo." };
  }
  if (res.status === 429) {
    return { ok: false, error: "Demasiados intentos. Espera un minuto." };
  }
  const json = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok || !json) {
    const msg = json?.message;
    return { ok: false, error: typeof msg === "string" ? msg : "No se pudo completar." };
  }
  return { ok: true, data: json };
}

export async function getMfaStatus(): Promise<MfaStatus | null> {
  const r = await mfaFetch<MfaStatus>("");
  return r.ok ? r.data : null;
}

/** Secreto nuevo + su código QR (generado aquí, sin pasar por terceros). */
export async function startMfaSetupAction(): Promise<
  Result<{ secret: string; qrDataUrl: string }>
> {
  const r = await mfaFetch<{ secret: string; otpauthUri: string }>("/setup", {});
  if (!r.ok) return r;
  const qrDataUrl = await QRCode.toDataURL(r.data.otpauthUri, {
    margin: 1,
    width: 208,
    color: { dark: "#170d04", light: "#faf7f1" },
  });
  return { ok: true, data: { secret: r.data.secret, qrDataUrl } };
}

export async function enableMfaAction(code: string) {
  return mfaFetch<{ recoveryCodes: string[] }>("/enable", { code });
}

export async function disableMfaAction(code: string) {
  return mfaFetch<{ enabled: boolean }>("/disable", { code });
}

export async function regenerateRecoveryCodesAction(code: string) {
  return mfaFetch<{ recoveryCodes: string[] }>("/recovery-codes", { code });
}
