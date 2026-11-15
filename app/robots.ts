import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// Solo la API se bloquea aquí. Paneles, cuenta, login y pago NO: llevan
// `X-Robots-Tag: noindex` (next.config.ts), y un rastreador bloqueado por
// robots.txt nunca llega a leer esa cabecera, con lo que la URL podría
// indexarse igual si alguien la enlaza.
const PRIVATE = ["/api/"];

// Rastreadores de buscadores con IA. Ya los cubre la regla general; se nombran
// para dejar explícito que el contenido público puede usarse en sus respuestas.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
