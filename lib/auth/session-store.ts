import { cache } from "react";
import { cookies, headers } from "next/headers";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";

export interface NeonUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  createdAt?: string | Date | null;
}

export interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  isPlatformOwner?: boolean;
  user?: { id?: string; name?: string; email?: string; image?: string };
  iat?: number;
  exp?: number;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const SECURE_NEON_COOKIES = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_challenge",
  "__Secure-neon-auth.session_challange",
] as const;

const STANDARD_LEGACY_COOKIES = [
  "customer_email",
  "customer_name",
  "bestcoffee-session",
  "neon-auth.session_token",
  "neon-auth.local.session_data",
  "neon-auth.session_challenge",
  "neon-auth.session_challange",
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.local.session_data",
] as const;

export function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as JwtClaims;
    }
  } catch {}
  return null;
}

export function formatNameFromEmail(email?: string | null, fallback = "Cliente"): string {
  if (!email) return fallback;
  return email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Usuario autenticado en Neon Auth (Google OAuth), SOLO desde fuentes verificadas.
 *
 * Nunca se decodifica la cookie `session_data` a mano: es un JWT y leer su
 * contenido sin comprobar la firma permitía fabricar una cookie con el correo
 * de otra persona y recibir su sesión. Las dos fuentes válidas son:
 *   1. `auth.getSession()` — el SDK verifica la firma (HS256 con el secreto de
 *      cookies) y, si no hay copia local válida, pregunta a Neon Auth.
 *   2. `/get-session` de Neon Auth con el token de sesión — necesario en HTTP
 *      local, donde las cookies `__Secure-` no existen y el SDK no las ve.
 */
export async function getNeonUser(): Promise<NeonUser | null> {
  if (!env.neonAuthUrl) return null;

  try {
    const { auth } = await import("./server");
    const sessionRes = (await auth.getSession()) as {
      data?: { user?: NeonUser } | null;
      user?: NeonUser;
      session?: { user?: NeonUser };
    } | null;
    const u = sessionRes?.data?.user ?? sessionRes?.user ?? sessionRes?.session?.user;
    if (u?.email) return u;
  } catch {}

  try {
    const c = await cookies();
    const sessionToken =
      c.get("__Secure-neon-auth.session_token")?.value ??
      c.get("neon-auth.session_token")?.value;
    if (sessionToken) {
      const res = await fetch(`${env.neonAuthUrl}/get-session`, {
        headers: {
          Cookie: `__Secure-neon-auth.session_token=${sessionToken}; neon-auth.session_token=${sessionToken}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: NeonUser } | null;
        if (data?.user?.email) return data.user;
      }
    }
  } catch {}

  return null;
}

/**
 * Resuelve la sesión del cliente actual, garantizando que si hay una sesión activa
 * de Google OAuth (Neon Auth) su token del backend NestJS esté sincronizado.
 * Memoizada por petición: una página llama varias veces a customerFetch y cada
 * llamada validaba la sesión de Neon (y a veces hacía una petición HTTP).
 */
export const getCustomerSession = cache(
  async (): Promise<{
    token: string | undefined;
    tenantSlug: string;
    isMockSession: boolean;
    neonUser: NeonUser | null;
  }> => {
  const c = await cookies();
  const h = await headers();
  const tenantSlug =
    h.get("x-tenant-slug") ??
    (await resolveActiveTenantSlug()) ??
    env.defaultTenantSlug;

  let token = c.get("customer_token")?.value;

  if (token === "mock-session-test") {
    return { token, tenantSlug, isMockSession: true, neonUser: null };
  }

  let neonUser: NeonUser | null = null;
  try {
    neonUser = await getNeonUser();
    if (neonUser?.email) {
      const tokenPayload = token ? decodeJwtClaims(token) : null;
      const tokenEmail = tokenPayload?.user?.email || tokenPayload?.email;
      const emailMismatch =
        Boolean(tokenEmail) &&
        tokenEmail!.toLowerCase() !== neonUser.email.toLowerCase();

      if (!token || emailMismatch) {
        const syncRes = await fetch(
          `${env.apiUrlInternal}/v1/auth/customer/neon-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
              "x-internal-secret": env.revalidateSecret,
            },
            body: JSON.stringify({
              email: neonUser.email,
              name: neonUser.name,
            }),
            cache: "no-store",
          },
        );
        if (syncRes.ok) {
          const syncData = (await syncRes.json()) as { accessToken?: string };
          if (syncData.accessToken) {
            token = syncData.accessToken;
          }
        }
      }
    }
  } catch {}

  return {
    token,
    tenantSlug,
    isMockSession: false,
    neonUser,
  };
  },
);

export function clearNeonAndLegacyCookies(store: CookieStore) {
  for (const name of SECURE_NEON_COOKIES) {
    store.set(name, "", {
      maxAge: 0,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  for (const name of STANDARD_LEGACY_COOKIES) {
    store.set(name, "", { maxAge: 0, path: "/" });
  }
}

export function setCustomerSessionCookies(store: CookieStore, token: string) {
  const cookieOpts = {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  store.set("customer_token", token, cookieOpts);
}

export function clearCustomerSessionCookies(store: CookieStore) {
  store.set("customer_token", "", { maxAge: 0, path: "/" });
  clearNeonAndLegacyCookies(store);
}

/**
 * Resuelve la sesión del operador de tienda o superadmin (incluyendo impersonación).
 */
export async function getOperatorSession(): Promise<{
  token: string | null;
  tenantSlug: string;
  impersonatingTenant: string | null;
  isLocalOperator: boolean;
  localClaims: JwtClaims | null;
}> {
  const c = await cookies();
  const h = await headers();
  const tenantSlug =
    h.get("x-tenant-slug") ??
    (await resolveActiveTenantSlug()) ??
    env.defaultTenantSlug;

  const impersonatingTenant = c.get("bestcoffee-impersonation-tenant")?.value ?? null;
  const token =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value ??
    null;

  const isLocalOperator = Boolean(token?.endsWith(".local_operator_session"));
  const localClaims = isLocalOperator && token ? decodeJwtClaims(token) : null;

  return {
    token,
    tenantSlug,
    impersonatingTenant,
    isLocalOperator,
    localClaims,
  };
}

export function setOperatorSessionCookie(store: CookieStore, token: string) {
  store.set("bestcoffee-operator-session", token, {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  store.set("bestcoffee-impersonation", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation-tenant", "", { maxAge: 0, path: "/" });
}

export function clearOperatorSessionCookies(store: CookieStore) {
  store.set("bestcoffee-operator-session", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation", "", { maxAge: 0, path: "/" });
  store.set("bestcoffee-impersonation-tenant", "", { maxAge: 0, path: "/" });
}

