import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

// Hosts treated as the platform shell (no tenant). `localhost` alone is the
// dev fallback for the platform; per-tenant work uses `<slug>.localhost:3000`.
const PLATFORM_HOSTS = new Set([
  "app.bestcoffee.io",
  "bestcoffee.io",
  "www.bestcoffee.io",
  "localhost",
]);

const RESERVED_SUBDOMAINS = new Set(["app", "www", "admin", "api"]);

export const config = {
  // Skip static assets and Next internals; everything else passes through.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

interface ResponseWithCookies extends Response {
  cookies?: {
    get: (name: string) => { value?: string } | undefined;
  };
}

interface JwtUserData {
  sub?: string;
  email?: string;
  name?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
}

function extractCookieFromResponse(res: Response, cookieName: string): string | undefined {
  const resWithCookies = res as ResponseWithCookies;
  if ("cookies" in res && typeof resWithCookies.cookies?.get === "function") {
    const val = resWithCookies.cookies.get(cookieName)?.value;
    if (val) return val;
  }
  if (typeof res.headers.getSetCookie === "function") {
    const list = res.headers.getSetCookie();
    for (const h of list) {
      const match = h.match(new RegExp(`(?:^|;\\s*)${cookieName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]+)`));
      if (match) return decodeURIComponent(match[1]);
    }
  }
  const raw = res.headers.get("set-cookie");
  if (raw) {
    const match = raw.match(new RegExp(`(?:^|;\\s*)${cookieName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

function decodeJwtPayload(token: string): JwtUserData | null {
  try {
    const parts = token.split(".");
    if (parts.length >= 2) {
      return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as JwtUserData;
    }
  } catch {}
  return null;
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // ── Neon Auth OAuth verifier exchange (e.g. returning from Google OAuth)
  if (url.searchParams.has("neon_auth_session_verifier")) {
    // Strip any stale session_token / session_data cookies from the incoming
    // request before passing it to Neon Auth's middleware. Only the OAuth
    // challenge cookie is needed to exchange neon_auth_session_verifier;
    // keeping a previous account's session_token causes Neon Auth's /get-session
    // endpoint to return the previous account's session instead of exchanging the verifier.
    const cleanHeaders = new Headers(req.headers);
    const rawCookie = req.headers.get("cookie") ?? "";
    const challengeCookies = rawCookie
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.includes("session_challenge") || c.includes("session_challange"))
      .join("; ");

    if (challengeCookies) {
      cleanHeaders.set("cookie", challengeCookies);
    } else {
      cleanHeaders.delete("cookie");
    }

    const cleanReq = new NextRequest(req.url, {
      method: req.method,
      headers: cleanHeaders,
    });

    const neonHandler = auth.middleware({ loginUrl: "/login" });
    const res = await neonHandler(cleanReq);

    try {
      // 1. Extraer cookie de datos de sesión emitida por el intercambio OAuth
      const sessionDataCookie =
        extractCookieFromResponse(res, "__Secure-neon-auth.local.session_data") ||
        extractCookieFromResponse(res, "neon-auth.local.session_data");

      const sessionToken =
        extractCookieFromResponse(res, "__Secure-neon-auth.session_token") ||
        extractCookieFromResponse(res, "neon-auth.session_token");

      let email: string | undefined;
      let name: string | undefined;

      if (sessionDataCookie) {
        const payload = decodeJwtPayload(sessionDataCookie);
        email = payload?.user?.email || payload?.email;
        name = payload?.user?.name || payload?.name;
      }

      // 2. Fallback consultando /get-session de Neon Auth con el nuevo token de sesión
      const neonBaseUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL;
      if (!email && sessionToken && neonBaseUrl) {
        try {
          const remoteRes = await fetch(`${neonBaseUrl}/get-session`, {
            headers: {
              Cookie: `__Secure-neon-auth.session_token=${sessionToken}; neon-auth.session_token=${sessionToken}`,
            },
            cache: "no-store",
          });
          if (remoteRes.ok) {
            const remoteData = await remoteRes.json();
            email = remoteData?.user?.email;
            name = remoteData?.user?.name;
          }
        } catch {
          // Neon Auth remote fetch fallback
        }
      }

      // 3. Limpiar cookies redundantes heredadas si existían en el navegador
      res.cookies.set("customer_email", "", { maxAge: 0, path: "/" });
      res.cookies.set("customer_name", "", { maxAge: 0, path: "/" });

      // 4. Sincronizar sesión con el backend NestJS
      if (email) {
        if (!name) {
          name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        }

        const cookieOpts = {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 60 * 60 * 24 * 30, // 30 días
        };

        // Replicar cookies sin prefijo __Secure- para lectura consistente en HTTP localhost
        if (sessionDataCookie) {
          res.cookies.set("neon-auth.local.session_data", sessionDataCookie, { ...cookieOpts, httpOnly: true });
        }
        if (sessionToken) {
          res.cookies.set("neon-auth.session_token", sessionToken, { ...cookieOpts, httpOnly: true });
        }

        let backendToken: string | undefined;
        try {
          const hostHeader = req.headers.get("host") ?? "";
          const host = hostHeader.split(":")[0].toLowerCase();
          const tenantSlug = resolveTenantSlug(host) || "origen";
          const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

          const syncRes = await fetch(`${apiUrl}/v1/auth/customer/neon-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
            },
            body: JSON.stringify({ email, name }),
            cache: "no-store",
          });

          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData?.accessToken) {
              backendToken = syncData.accessToken;
            }
          }
        } catch {
          // Backend NestJS offline: usar token de sesión local de respaldo
        }

        if (!backendToken) {
          const sessionPayload = {
            sub: email,
            email,
            name,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
          };
          const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
          const payloadB64 = Buffer.from(JSON.stringify(sessionPayload)).toString("base64url");
          backendToken = `${headerB64}.${payloadB64}.local_session`;
        }

        res.cookies.set("customer_token", backendToken, { ...cookieOpts, httpOnly: true });
        res.cookies.set("bestcoffee-session", backendToken, { ...cookieOpts, httpOnly: true });
      }
    } catch (err) {
      console.warn("Middleware neon-sync notice:", err);
    }

    return res;
  }

  // ── Auth route guard (/admin + /cuenta + /platform/superadmin require session)
  const isCustomerRoute = url.pathname.startsWith("/cuenta");
  const isOperatorRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/platform/superadmin");

  if (isCustomerRoute) {
    const customerSession =
      req.cookies.get("bestcoffee-session")?.value ??
      req.cookies.get("customer_token")?.value ??
      req.cookies.get("__Secure-neon-auth.session_token")?.value ??
      req.cookies.get("neon-auth.session_token")?.value ??
      req.cookies.get("__Secure-neon-auth.local.session_data")?.value ??
      req.cookies.get("neon-auth.local.session_data")?.value;
    if (!customerSession) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } else if (isOperatorRoute) {
    const operatorSession =
      req.cookies.get("bestcoffee-impersonation")?.value ??
      req.cookies.get("bestcoffee-operator-session")?.value;
    if (!operatorSession) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/acceso";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  const hostHeader = req.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0].toLowerCase();

  const tenantSlug = resolveTenantSlug(host);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-host", host);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  } else {
    requestHeaders.delete("x-tenant-slug");
  }

  // Platform host serves SaaS landing/onboarding under app/platform/*.
  // Rewrite root paths so `/` on the platform shows the platform landing
  // while `/` on a tenant subdomain stays as the storefront home.
  if (!tenantSlug && !url.pathname.startsWith("/platform")) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/platform${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  // Tenant host hitting /platform/* directly: bounce back to root.
  // In dev, localhost doubles as both platform host and default tenant — allow
  // /platform/* to pass through so superadmin is testable without a subdomain.
  if (tenantSlug && url.pathname.startsWith("/platform") && process.env.NODE_ENV === "production") {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = "/";
    return NextResponse.redirect(rewriteUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function resolveTenantSlug(host: string): string | null {
  if (PLATFORM_HOSTS.has(host)) {
    // In local dev, plain `localhost` (no subdomain) falls back to the default
    // tenant so the storefront works at http://localhost:3000 without needing
    // <slug>.localhost. This only applies outside production.
    if (process.env.NODE_ENV !== "production" && host === "localhost") {
      return process.env.DEFAULT_TENANT_SLUG ?? "origen";
    }
    return null;
  }
  const parts = host.split(".");
  // `<slug>.localhost` in dev, or `<slug>.bestcoffee.io` in prod.
  if (parts.length < 2) return null;
  const first = parts[0];
  if (!first || RESERVED_SUBDOMAINS.has(first)) return null;
  return first;
}
