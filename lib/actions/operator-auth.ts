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
export async function verifyOperatorMagicLink(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (!email || !token) return { error: "Enlace de acceso incompleto." };

  let accessToken: string | undefined;
  let isPlatformOwner: boolean | undefined;

  // 1. Intentar validar con el backend NestJS si está activo
  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
      cache: "no-store",
    });
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        accessToken?: string;
        user?: { isPlatformOwner?: boolean };
      };
      if (body.accessToken) {
        accessToken = body.accessToken;
        isPlatformOwner = body.user?.isPlatformOwner;
      }
    }
  } catch {
    // Backend offline
  }

  // 2. Fallback: validar token firmado localmente
  if (!accessToken) {
    const verifiedData = verifySignedMagicToken(token, env.authSecret);
    if (!verifiedData || verifiedData.email.toLowerCase() !== email.toLowerCase()) {
      return { error: "El enlace de acceso es inválido o ha expirado." };
    }

    const isOwner =
      email.toLowerCase() ===
      (env.platformOwnerEmail || "logijavier@gmail.com").toLowerCase();
    isPlatformOwner = isOwner;

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
    accessToken = `${headerB64}.${payloadB64}.local_operator_session`;
  }

  if (!accessToken) {
    return { error: "No se pudo autenticar la sesión." };
  }

  // La sesión de operador vive en bestcoffee-operator-session
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
