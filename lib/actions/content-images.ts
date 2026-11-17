"use server";

import { operatorStorageTenant } from "../auth/operator-guard";
import { CONTENT_FOLDERS, contentImagePrefix, deleteBlobWithin, type ContentFolder } from "../storage/blob-paths";

// Subida de imágenes de contenido (portadas de blog y guías, imágenes de las
// páginas editoriales). El navegador sube directo a Vercel Blob vía
// /api/admin/blob-upload; aquí solo se da la carpeta de la tienda y se
// descartan archivos recién subidos que no llegaron a guardarse.

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Carpeta donde el navegador debe subir: content/<tienda>/<carpeta>/. */
export async function contentUploadPrefixAction(folder: ContentFolder): Promise<Result<string>> {
  if (!(CONTENT_FOLDERS as readonly string[]).includes(folder)) {
    return { ok: false, error: "Carpeta no válida." };
  }
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug) return { ok: false, error: "No tienes permiso para subir imágenes." };
  return { ok: true, data: `${contentImagePrefix(tenantSlug)}${folder}/` };
}

/**
 * Descarta una imagen subida en esta edición que se reemplazó o no se guardó.
 * Solo borra dentro de la carpeta de contenido de la tienda del operador.
 */
export async function discardContentImageAction(url: string): Promise<void> {
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug || typeof url !== "string") return;
  await deleteBlobWithin(url, contentImagePrefix(tenantSlug));
}
