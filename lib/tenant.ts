import { headers } from "next/headers";
import { env } from "./env";

export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-slug");
}

export async function resolveActiveTenantSlug(): Promise<string> {
  const slug = await getTenantSlug();
  return slug ?? env.defaultTenantSlug;
}

export async function requireTenantSlug(): Promise<string> {
  const slug = await getTenantSlug();
  if (!slug) {
    throw new Error("No tenant context: this route requires a tenant subdomain");
  }
  return slug;
}
