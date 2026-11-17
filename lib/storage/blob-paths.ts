import { del } from "@vercel/blob";

// Rutas permitidas en Vercel Blob por tienda y borrado acotado a ellas.
// Módulo de servidor sin "use server": sus funciones NO son acciones invocables
// desde el navegador; quien las llama ya confirmó la tienda del operador
// (operatorStorageTenant, validado contra el backend).
//
//   products/<tienda>/<producto|draft>/<archivo>   → galería de productos
//   content/<tienda>/<blog|guides|pages>/<archivo> → portadas e imágenes de contenido

export const CONTENT_FOLDERS = ["blog", "guides", "pages"] as const;
export type ContentFolder = (typeof CONTENT_FOLDERS)[number];

export const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Prefijo de las imágenes de contenido (blog, guías, páginas) de una tienda. */
export function contentImagePrefix(tenantSlug: string): string {
  return `content/${tenantSlug}/`;
}

const FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,150}$/;

/**
 * ¿Puede el operador de `tenantSlug` subir a `pathname`? Solo dentro de las
 * carpetas de su tienda y sin `..`. Productos conserva la regla de siempre (el
 * nombre del archivo lo pone el navegador tal cual); contenido es estricto:
 * content/<tienda>/<blog|guides|pages>/<archivo saneado>.
 */
export function isAllowedUploadPath(pathname: string, tenantSlug: string): boolean {
  if (pathname.includes("..") || pathname.includes("\\")) return false;
  if (pathname.startsWith(`products/${tenantSlug}/`)) return true;
  const parts = pathname.split("/");
  if (parts.length !== 4) return false;
  const [root, tenant, folder, file] = parts;
  return (
    root === "content" &&
    tenant === tenantSlug &&
    (CONTENT_FOLDERS as readonly string[]).includes(folder) &&
    FILE.test(file)
  );
}

/**
 * Borra un archivo de Vercel Blob solo si su ruta empieza por `prefix`
 * (p. ej. `content/<tienda>/`). Ignora URLs que no son de Blob (p. ej. /img/…).
 */
export async function deleteBlobWithin(url: string, prefix: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) return;
  const path = decodeURIComponent(parsed.pathname);
  if (path.includes("..") || !path.startsWith(`/${prefix}`)) return;
  try {
    await del(url);
  } catch {
    /* si falla, el archivo queda huérfano pero la UI sigue consistente */
  }
}
