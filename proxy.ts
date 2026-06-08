import { NextRequest, NextResponse } from "next/server";

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

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
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
  if (tenantSlug && url.pathname.startsWith("/platform")) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = "/";
    return NextResponse.redirect(rewriteUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function resolveTenantSlug(host: string): string | null {
  if (PLATFORM_HOSTS.has(host)) return null;
  const parts = host.split(".");
  // `<slug>.localhost` in dev, or `<slug>.bestcoffee.io` in prod.
  if (parts.length < 2) return null;
  const first = parts[0];
  if (!first || RESERVED_SUBDOMAINS.has(first)) return null;
  return first;
}
