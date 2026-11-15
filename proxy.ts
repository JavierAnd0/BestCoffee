import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

// Hosts treated as the platform shell (no tenant). `localhost` alone is the
// dev fallback for the platform; per-tenant work uses `<slug>.localhost:3000`.
// The apex domain comes from NEXT_PUBLIC_PLATFORM_DOMAIN so the same build can
// run under any domain (tenants live at `<slug>.<PLATFORM_DOMAIN>`).
const PLATFORM_DOMAIN = (
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "bestcoffee.io"
).toLowerCase();

const PLATFORM_HOSTS = new Set([
  `app.${PLATFORM_DOMAIN}`,
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  "localhost",
]);

const RESERVED_SUBDOMAINS = new Set(["app", "www", "admin", "api"]);

const SEO_FILES = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

export const config = {
  // Skip static assets and Next internals; everything else passes through.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
    // Archivos de SEO: llevan punto en el nombre (la regla de arriba los
    // excluiría), pero necesitan saber qué tienda corresponde al host.
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
  ],
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
          const tenantSlug = (await resolveTenantSlug(host)) || "origen";
          const apiUrl = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

          const syncRes = await fetch(`${apiUrl}/v1/auth/customer/neon-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
              "x-internal-secret":
                process.env.REVALIDATE_SECRET ||
                // Sin valor por defecto en producción: si falta, el backend rechaza.
                (process.env.NODE_ENV === "production" ? "" : "dev-revalidate-secret"),
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
        } catch (syncErr) {
          // Backend NestJS offline or unreachable: NEVER fabricate a session.
          // An unsigned/fake token would let anyone impersonate any email.
          console.error("Middleware neon-sync failed, denying session:", syncErr);
        }

        // Only a real, backend-issued (signed) token results in a session.
        // If the backend didn't return one, fail visibly instead of minting
        // a fake local session.
        if (backendToken) {
          res.cookies.set("customer_token", backendToken, { ...cookieOpts, httpOnly: true });
        } else {
          const loginUrl = url.clone();
          loginUrl.pathname = "/login";
          loginUrl.search = "";
          loginUrl.searchParams.set("error", "session_sync_failed");
          return NextResponse.redirect(loginUrl);
        }
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

  const tenantSlug = await resolveTenantSlug(host);

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
  // Los archivos de SEO se sirven tal cual también en el host de la plataforma.
  if (SEO_FILES.has(url.pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

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

// Dominio propio → tienda. Solo cuenta si el backend lo tiene VERIFICADO (el
// dueño demostró el dominio con un registro TXT). Caché corta en memoria para
// no consultar al backend en cada visita; los fallos se cachean menos tiempo.
const customDomainCache = new Map<string, { slug: string | null; exp: number }>();
const DOMAIN_TTL_MS = 60_000;
const DOMAIN_MISS_TTL_MS = 15_000;

async function resolveCustomDomain(host: string): Promise<string | null> {
  const now = Date.now();
  const cached = customDomainCache.get(host);
  if (cached && cached.exp > now) return cached.slug;

  let slug: string | null = null;
  let ttl = DOMAIN_MISS_TTL_MS;
  try {
    const apiUrl =
      process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/v1/tenant-domains/resolve?host=${encodeURIComponent(host)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = (await res.json()) as { slug?: string };
      if (typeof data.slug === "string" && /^[a-z0-9-]+$/.test(data.slug)) {
        slug = data.slug;
        ttl = DOMAIN_TTL_MS;
      }
    }
  } catch {
    // Backend no disponible: se trata como "no es un dominio de tienda".
  }
  customDomainCache.set(host, { slug, exp: now + ttl });
  // Evita que la caché crezca sin límite con hosts arbitrarios.
  if (customDomainCache.size > 500) customDomainCache.clear();
  return slug;
}

async function resolveTenantSlug(host: string): Promise<string | null> {
  if (PLATFORM_HOSTS.has(host)) {
    // In local dev, plain `localhost` (no subdomain) falls back to the default
    // tenant so the storefront works at http://localhost:3000 without needing
    // <slug>.localhost. This only applies outside production.
    if (process.env.NODE_ENV !== "production" && host === "localhost") {
      return process.env.DEFAULT_TENANT_SLUG ?? "origen";
    }
    return null;
  }
  // `<slug>.localhost` in dev, or `<slug>.<PLATFORM_DOMAIN>` in prod.
  for (const suffix of [".localhost", `.${PLATFORM_DOMAIN}`]) {
    if (!host.endsWith(suffix)) continue;
    const sub = host.slice(0, -suffix.length);
    // Only one label deep: `a.b.<domain>` is not a tenant.
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  // Otro host: primero, ¿es el dominio propio VERIFICADO de una tienda? (nunca se
  // infiere de su primer segmento: `tienda.caferoma.com` no es la tienda "tienda").
  // La URL del propio despliegue (*.vercel.app) nunca es un dominio de cliente:
  // no se gasta una consulta al backend (con hasta 2,5 s de espera) en cada visita.
  const own = host.endsWith(".vercel.app") ? null : await resolveCustomDomain(host);
  if (own) return own;

  // Si no, es la URL del propio deploy (*.vercel.app), una vista previa, o un
  // dominio apuntado a un deploy de una sola tienda: sirve DEFAULT_TENANT_SLUG si
  // el deploy la fija, y la presentación de la plataforma en caso contrario.
  return process.env.DEFAULT_TENANT_SLUG || null;
}
