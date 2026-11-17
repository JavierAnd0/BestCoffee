// Imágenes con URL libre escrita en el panel (portadas de blog y guías).
//
// `next/image` solo optimiza hosts declarados en `images.remotePatterns` de
// next.config.ts; abrirlo a cualquier host convertiría el optimizador del
// servidor en un proxy de descargas para terceros. Por eso:
//  - URL https de un host permitido → se optimiza como cualquier otra imagen.
//  - URL https de otro host → `unoptimized`: el navegador la pide directamente
//    al host, el servidor no la descarga.
//  - Ruta local ("/img/…") → se optimiza.
//  - Cualquier otra cosa (http, data:, javascript:…) → no se muestra.

/** Debe coincidir con `images.remotePatterns` de next.config.ts. */
const OPTIMIZED_HOSTS = [
  /\.public\.blob\.vercel-storage\.com$/,
  /^picsum\.photos$/,
  /\.googleusercontent\.com$/,
  /^images\.unsplash\.com$/,
];

export interface RemoteImage {
  src: string;
  unoptimized: boolean;
}

export function remoteImage(url: string | null | undefined): RemoteImage | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return { src: raw, unoptimized: false };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const optimized = OPTIMIZED_HOSTS.some((re) => re.test(parsed.hostname));
  return { src: parsed.toString(), unoptimized: !optimized };
}
