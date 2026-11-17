"use server";

import { revalidatePath } from "next/cache";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import { operatorStorageTenant, productImagePrefix } from "../auth/operator-guard";
import { deleteBlobWithin } from "../storage/blob-paths";
import type { ProductImage } from "../types";

// Server actions para la galería de un producto. El archivo ya está en Vercel
// Blob (lo sube el navegador vía /api/admin/blob-upload); aquí solo se registra,
// reordena o elimina la referencia en la API.

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function revalidateProduct(productId: string) {
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/catalogo");
  revalidatePath("/p/[slug]", "page");
}

export async function attachProductImageAction(
  productId: string,
  url: string,
  alt?: string,
): Promise<Result<ProductImage>> {
  if (env.useMocks) {
    return { ok: true, data: { id: `mock_${Date.now()}`, url, alt } };
  }
  const r = await operatorFetch<Partial<ProductImage>>(
    `/v1/admin/products/${productId}/images`,
    {
      method: "POST",
      body: { url, alt },
    },
  );
  if (!r.ok) return { ok: false, error: r.error || "No se pudo guardar la imagen." };
  const img = r.data;
  revalidateProduct(productId);
  return {
    ok: true,
    data: { id: img?.id ?? `tmp_${Date.now()}`, url: img?.url ?? url, alt: img?.alt ?? alt },
  };
}

export async function reorderProductImagesAction(
  productId: string,
  imageIds: string[],
): Promise<Result> {
  if (env.useMocks) return { ok: true, data: undefined };
  const r = await operatorFetch(`/v1/admin/products/${productId}/images/reorder`, {
    method: "PATCH",
    body: { imageIds },
  });
  if (!r.ok) return { ok: false, error: r.error || "No se pudo reordenar la galería." };
  revalidateProduct(productId);
  return { ok: true, data: undefined };
}

export async function removeProductImageAction(
  productId: string,
  imageId: string,
): Promise<Result> {
  if (env.useMocks) return { ok: true, data: undefined };
  const r = await operatorFetch<{ url?: string }>(`/v1/admin/products/images/${imageId}`, {
    method: "DELETE",
  });
  if (!r.ok) return { ok: false, error: r.error || "No se pudo eliminar la imagen." };
  revalidateProduct(productId);
  // Se borra el archivo que el backend dice que tenía la imagen (de esta
  // tienda), nunca una URL enviada por el cliente.
  if (r.data?.url) await deleteBlob(r.data.url);
  return { ok: true, data: undefined };
}

/** Prefijo donde el navegador debe subir las imágenes de esta tienda. */
export async function imageUploadPrefixAction(): Promise<Result<string>> {
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug) return { ok: false, error: "No tienes permiso para subir imágenes." };
  return { ok: true, data: productImagePrefix(tenantSlug) };
}

/**
 * Descarta un archivo recién subido que no llegó a registrarse (producto nuevo
 * o registro fallido). Solo dentro de la carpeta de la tienda del operador.
 */
export async function discardUploadedImageAction(url: string): Promise<void> {
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (!parsed.pathname.startsWith(`/${productImagePrefix(tenantSlug)}`)) return;
  await deleteBlob(url);
}

/**
 * Borra un archivo de Vercel Blob. Interna (no exportada): no es una acción de
 * servidor invocable desde fuera; quien la llama ya comprobó la propiedad.
 * Ignora URLs que no son imágenes de producto en Blob (p. ej. /img/...).
 */
async function deleteBlob(url: string): Promise<void> {
  await deleteBlobWithin(url, "products/");
}
