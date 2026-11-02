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
 * Extrae el usuario autenticado en Neon Auth (Google OAuth) leyendo únicamente
 * las cookies oficiales de sesión de Neon Auth.
 */
export async function getNeonUser(): Promise<NeonUser | null> {
  try {
    const c = await cookies();

    const sessionDataCookies = [
      c.get("__Secure-neon-auth.local.session_data")?.value,
      c.get("neon-auth.local.session_data")?.value,
    ];

    for (const val of sessionDataCookies) {
      if (!val) continue;
      const payload = decodeJwtClaims(val);
      if (payload) {
        const email = payload.user?.email || payload.email;
        const name = payload.user?.name || payload.name || formatNameFromEmail(email);
        const userId = payload.user?.id || payload.sub;
        if (email) {
          return { email, name, id: userId };
        }
      }
    }

    const sessionToken =
      c.get("__Secure-neon-auth.session_token")?.value ??
      c.get("neon-auth.session_token")?.value;

    if (sessionToken && env.neonAuthUrl) {
      try {
        const res = await fetch(`${env.neonAuthUrl}/get-session`, {
          headers: {
            Cookie: `__Secure-neon-auth.session_token=${sessionToken}; neon-auth.session_token=${sessionToken}`,
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { user?: NeonUser } | null;
          if (data?.user && (data.user.name || data.user.email)) {
            return data.user;
          }
        }
      } catch {}
    }

    if (env.neonAuthUrl) {
      try {
        const { auth } = await import("./server");
        const sessionRes = (await auth.getSession()) as {
          data?: { user?: NeonUser };
          user?: NeonUser;
          session?: { user?: NeonUser };
        } | null;
        const u =
          sessionRes?.data?.user ??
          sessionRes?.user ??
          sessionRes?.session?.user;
        if (u && (u.name || u.email)) {
          return u;
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Resuelve la sesión del cliente actual, garantizando que si hay una sesión activa
 * de Google OAuth (Neon Auth) su token del backend NestJS esté sincronizado.
 */
export async function getCustomerSession(): Promise<{
  token: string | undefined;
  tenantSlug: string;
  isMockSession: boolean;
  neonUser: NeonUser | null;
}> {
  const c = await cookies();
  const h = await headers();
  const tenantSlug =
    h.get("x-tenant-slug") ??
    (await resolveActiveTenantSlug()) ??
    env.defaultTenantSlug;

  let token =
    c.get("bestcoffee-session")?.value ??
    c.get("customer_token")?.value;

  if (token === "mock-session-test") {
    return { token, tenantSlug, isMockSession: true, neonUser: null };
  }

  let neonUser: NeonUser | null = null;
  try {
    neonUser = await getNeonUser();
    if (neonUser?.email) {
      const tokenPayload = token ? decodeJwtClaims(token) : null;
      const tokenEmail = tokenPayload?.user?.email || tokenPayload?.email;
      const isLocalFallback = token?.endsWith(".local_session") ?? false;
      const emailMismatch =
        Boolean(tokenEmail) &&
        tokenEmail!.toLowerCase() !== neonUser.email.toLowerCase();

      if (!token || isLocalFallback || emailMismatch) {
        const syncRes = await fetch(
          `${env.apiUrlInternal}/v1/auth/customer/neon-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
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
}

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
  store.set("bestcoffee-session", token, cookieOpts);
  store.set("customer_token", token, cookieOpts);
}

export function clearCustomerSessionCookies(store: CookieStore) {
  store.set("bestcoffee-session", "", { maxAge: 0, path: "/" });
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

