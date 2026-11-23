import { headers } from "next/headers";
import { env } from "./env";

// URLs absolutas entre la plataforma y las tiendas. Viven en hosts distintos
// (`bestkofi.com` y `<slug>.bestkofi.com`; en local `localhost` y
// `<slug>.localhost`), así que una cookie puesta en uno no llega al otro.

function platformDomain(): string | null {
  const d = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return d || null;
}

/** Puerto de la petición actual en local (p. ej. ":3000"), o "". */
async function devPort(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  const port = host.split(":")[1];
  return port ? `:${port}` : "";
}

/** Origen de una tienda: `https://<slug>.<dominio>` (local: `http://<slug>.localhost:<puerto>`). */
export async function tenantOrigin(slug: string): Promise<string> {
  const domain = platformDomain();
  if (!env.isDev && domain) return `https://${slug}.${domain}`;
  return `http://${slug}.localhost${await devPort()}`;
}

/** Origen del panel de la plataforma: `https://<dominio>` (local: `http://localhost:<puerto>`). */
export async function platformOrigin(): Promise<string> {
  const domain = platformDomain();
  if (!env.isDev && domain) return `https://${domain}`;
  return `http://localhost${await devPort()}`;
}
