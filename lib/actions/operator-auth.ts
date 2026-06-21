"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";

export type MagicLinkState = null | { error: string } | { sent: true };
export type VerifyState = null | { error: string };

// ── Paso 1: solicitar el enlace de acceso (magic link) ──────────────────────────
export async function requestOperatorMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "El correo es requerido." };

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    let message = "No se pudo enviar el enlace. Intenta de nuevo.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body?.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    return { error: message };
  }

  // El backend responde genérico (anti-enumeración); siempre marcamos enviado.
  return { sent: true };
}

// ── Paso 2: canjear el token del enlace por una sesión de operador ──────────────
export async function verifyOperatorMagicLink(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (!email || !token) return { error: "Enlace de acceso incompleto." };

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    let message = "El enlace de acceso es inválido o ha expirado.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body?.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    return { error: message };
  }

  const body = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    user?: { isPlatformOwner?: boolean; tenants?: unknown[] };
  };
  if (!body.accessToken) {
    return { error: "Respuesta inválida del servidor." };
  }

  // La sesión de operador vive en bestcoffee-session: el middleware la usa para
  // proteger rutas y apiServer() la reenvía como Bearer a /v1/admin y /v1/platform.
  const store = await cookies();
  store.set("bestcoffee-session", body.accessToken, {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días, igual que el JWT
  });

  // Decide el destino según el rol. La respuesta de verify ya puede traer
  // isPlatformOwner; si no (backend viejo), lo confirmamos contra /v1/auth/me,
  // que es la fuente de verdad. Así el routing no depende del shape de verify.
  const destination = await resolveOperatorHome(
    body.accessToken,
    body.user?.isPlatformOwner,
  );
  redirect(destination);
}

/**
 * Devuelve la ruta de inicio del operador: el dueño de la plataforma va al panel
 * de superadmin; los operadores de tienda, a su panel admin.
 */
async function resolveOperatorHome(
  token: string,
  isPlatformOwnerHint?: boolean,
): Promise<string> {
  if (isPlatformOwnerHint === true) return "/platform/superadmin";

  // Fallback: preguntar al backend si este operador es dueño de la plataforma.
  try {
    const meRes = await fetch(`${env.apiUrlInternal}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { isPlatformOwner?: boolean };
      if (me.isPlatformOwner) return "/platform/superadmin";
    }
  } catch {
    /* si falla, cae al panel admin de tienda */
  }
  return "/admin";
}
