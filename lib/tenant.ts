import { headers } from "next/headers";

export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-slug");
}

export async function requireTenantSlug(): Promise<string> {
  const slug = await getTenantSlug();
  if (!slug) {
    throw new Error("No tenant context: this route requires a tenant subdomain");
  }
  return slug;
}
