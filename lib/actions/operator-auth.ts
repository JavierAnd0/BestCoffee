"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";
import { clientIpHeaders } from "@/lib/api/client-ip";

export type MagicLinkState = null | { error: string } | { sent: true };
export type VerifyState = null | { error: string };

// ── Paso 1: solicitar el enlace de acceso (magic link) ──────────────────────────
export async function requestOperatorMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "El correo es requerido." };

  // El enlace lo genera y envía solo el backend (con su límite de intentos).
  // Si no responde, se avisa: nunca se manda un correo desde aquí, porque se
  // saltaría ese límite y permitiría enviar correos a cualquier dirección.
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/login`, {
      method: "POST",
      headers: { ...(await clientIpHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return { error: "No pudimos conectar con el servidor. Inténtalo de nuevo en un momento." };
  }
  if (res.status === 429) {
    return { error: "Pediste varios enlaces seguidos. Espera un minuto antes de volver a intentarlo." };
  }
  if (!res.ok && res.status >= 500) {
    return { error: "No pudimos enviar el enlace. Inténtalo de nuevo en un momento." };
  }

  // Anti-enumeración: siempre responder que el enlace fue enviado
  return { sent: true };
}

// ── Paso 2: canjear el token del enlace por una sesión de operador ──────────────
/** Cookie del paso pendiente de 2FA: vale 5 min y solo para /acceso. */
const MFA_PENDING_COOKIE = "bestcoffee-mfa-pending";

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
      headers: { ...(await clientIpHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
      cache: "no-store",
    });
  } catch {
    return { error: "No pudimos conectar con el servidor. Inténtalo de nuevo en un momento." };
  }

  if (!res.ok) return { error: "El enlace de acceso es inválido o ha expirado." };
  const body = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    mfaRequired?: boolean;
    mfaToken?: string;
    user?: { isPlatformOwner?: boolean };
  };
  if (body.mfaRequired && body.mfaToken) {
    const store = await cookies();
    store.set(MFA_PENDING_COOKIE, body.mfaToken, {
      httpOnly: true,
      secure: !env.isDev,
      sameSite: "lax",
      path: "/acceso",
      maxAge: 5 * 60,
    });
    redirect("/acceso/2fa");
  }
  if (!body.accessToken) return { error: "No se pudo autenticar la sesión." };
  return startOperatorSession(body.accessToken, body.user?.isPlatformOwner);
}

// ── Paso 3 (solo con 2FA): código de la app o de respaldo ───────────────────────
export type MfaVerifyState = null | { error: string; expired?: boolean };

export async function verifyOperatorMfaAction(
  _prev: MfaVerifyState,
  formData: FormData,
): Promise<MfaVerifyState> {
  const code = String(formData.get("code") ?? "").trim();
  const store = await cookies();
  const mfaToken = store.get(MFA_PENDING_COOKIE)?.value;
  if (!mfaToken) {
    return { error: "Tu acceso expiró. Vuelve a pedir el enlace.", expired: true };
  }
  if (code.replace(/[\s-]/g, "").length < 6) {
    return { error: "Escribe el código de 6 dígitos de tu app." };
  }

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/mfa/verify`, {
      method: "POST",
      headers: { ...(await clientIpHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ mfaToken, code }),
      cache: "no-store",
    });
  } catch {
    return { error: "No pudimos conectar con el servidor. Inténtalo de nuevo." };
  }

  if (res.status === 429) {
    return { error: "Demasiados intentos. Espera un minuto antes de volver a probar." };
  }
  const body = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    message?: string;
    user?: { isPlatformOwner?: boolean };
  };
  if (!res.ok || !body.accessToken) {
    const expired = /expir/i.test(body.message ?? "");
    if (expired) store.set(MFA_PENDING_COOKIE, "", { maxAge: 0, path: "/acceso" });
    return {
      error: expired
        ? "Tu acceso expiró. Vuelve a pedir el enlace."
        : "El código no es válido. Revisa la hora del teléfono e inténtalo de nuevo.",
      expired,
    };
  }

  store.set(MFA_PENDING_COOKIE, "", { maxAge: 0, path: "/acceso" });
  return startOperatorSession(body.accessToken, body.user?.isPlatformOwner);
}

/** Guarda la sesión de operador y lleva a su panel. */
async function startOperatorSession(
  accessToken: string,
  isPlatformOwner?: boolean,
): Promise<never> {
  const store = await cookies();
  store.set("bestcoffee-operator-session", accessToken, {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  store.set("bestcoffee-impersonation", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation-tenant", "", { maxAge: 0, path: "/" });

  const destination = await resolveOperatorHome(accessToken, isPlatformOwner);
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
      headers: { ...(await clientIpHeaders()), Authorization: `Bearer ${token}` },
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

// ── Cerrar sesión de operador / superadmin ──────────────────────────────────────
export async function logoutOperatorAction() {
  const store = await cookies();
  store.set("bestcoffee-operator-session", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation-tenant", "", { maxAge: 0, path: "/" });
  redirect("/acceso");
}

// ── Salir del modo impersonación y volver a superadmin ─────────────────────────
export async function stopImpersonationAction() {
  const store = await cookies();
  store.set("bestcoffee-impersonation", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation-tenant", "", { maxAge: 0, path: "/" });
  redirect("/platform/superadmin/tenants");
}
