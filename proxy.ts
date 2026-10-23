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

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // ── Neon Auth OAuth verifier exchange (e.g. returning from Google OAuth)
  if (url.searchParams.has("neon_auth_session_verifier")) {
    const neonHandler = auth.middleware({ loginUrl: "/login" });
    const res = await neonHandler(req);

    // Sincronizar automáticamente con el backend NestJS para emitir customer_token en la respuesta
    try {
      const sessionDataCookie =
        res.cookies.get("__Secure-neon-auth.local.session_data")?.value ??
        res.cookies.get("neon-auth.local.session_data")?.value;

      let email: string | undefined;
      let name: string | undefined;

      if (sessionDataCookie) {
        const parts = sessionDataCookie.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
          email = payload?.user?.email;
          name = payload?.user?.name;
        }
      }

      if (email) {
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
            const cookieOpts = {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax" as const,
              maxAge: 60 * 60 * 24 * 30,
            };
            res.cookies.set("customer_token", syncData.accessToken, cookieOpts);
            res.cookies.set("bestcoffee-session", syncData.accessToken, cookieOpts);
          }
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
      req.cookies.get("bestcoffee-session")?.value ??
      req.cookies.get("customer_token")?.value ??
      req.cookies.get("__Secure-neon-auth.session_token")?.value ??
      req.cookies.get("neon-auth.session_token")?.value ??
      req.cookies.get("better-auth.session_token")?.value;
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
