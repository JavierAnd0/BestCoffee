"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";
import { sendMagicLinkEmail } from "../email/resend";

export type MagicLinkState = null | { error: string } | { sent: true };
export type VerifyState = null | { error: string };

function createSignedMagicToken(email: string, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      email,
      type: "operator_magic_link",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutos
    }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function verifySignedMagicToken(
  token: string,
  secret: string,
): { email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as { email?: string; type?: string; exp?: number };
    if (data.type !== "operator_magic_link" || !data.email) return null;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

// ── Paso 1: solicitar el enlace de acceso (magic link) ──────────────────────────
export async function requestOperatorMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "El correo es requerido." };

  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // 1. Intentar enviar mediante el backend NestJS si está activo
  let backendSent = false;
  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (res.ok) {
      backendSent = true;
    }
  } catch {
    // Backend offline: despacho directo con Resend
  }

  // 2. Si el backend no despachó el correo o está offline, generar magic link local y enviar por Resend
  if (!backendSent) {
    const localToken = createSignedMagicToken(email, env.authSecret);
    const magicLink = `${origin}/acceso/verificar?email=${encodeURIComponent(email)}&token=${localToken}`;

    const resendResult = await sendMagicLinkEmail({
      to: email,
      magicLink,
    });

    if (!resendResult.success) {
      console.info(
        `[BestCoffee Acceso]: Enlace mágico generado para ${email}: ${magicLink}`,
      );
    }
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

  // 1. Validar con el backend.
  let res: Response | null = null;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
      cache: "no-store",
    });
  } catch {
    res = null; // backend sin conexión
  }

  if (res) {
    // El backend respondió: su respuesta manda. Nunca se cae al modo local,
    // que se saltaría la verificación en dos pasos.
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

  // 2. Solo en desarrollo y sin backend: token firmado localmente.
  if (!env.isDev) {
    return { error: "No pudimos conectar con el servidor. Inténtalo de nuevo en un momento." };
  }
  const verifiedData = verifySignedMagicToken(token, env.authSecret);
  if (!verifiedData || verifiedData.email.toLowerCase() !== email.toLowerCase()) {
    return { error: "El enlace de acceso es inválido o ha expirado." };
  }
  const isOwner =
    email.toLowerCase() ===
    (env.platformOwnerEmail || "logijavier@gmail.com").toLowerCase();
  const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(
    JSON.stringify({
      sub: email,
      email,
      isPlatformOwner: isOwner,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }),
  ).toString("base64url");
  return startOperatorSession(`${headerB64}.${payloadB64}.local_operator_session`, isOwner);
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
      headers: { "Content-Type": "application/json" },
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
