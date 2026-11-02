"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import { getOperatorSession } from "../auth/session-store";
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
  url: string,
): Promise<Result> {
  if (!env.useMocks) {
    const r = await operatorFetch(`/v1/admin/products/images/${imageId}`, {
      method: "DELETE",
    });
    if (!r.ok) return { ok: false, error: r.error || "No se pudo eliminar la imagen." };
    revalidateProduct(productId);
  }
  await deleteBlobAction(url);
  return { ok: true, data: undefined };
}

/** Borra el archivo de Vercel Blob. Ignora URLs que no son de Blob (p.ej. /img/...). */
export async function deleteBlobAction(url: string): Promise<void> {
  if (!url.includes(".blob.vercel-storage.com")) return;
  const { token } = await getOperatorSession();
  if (!token) return;
  try {
    await del(url);
  } catch {
    /* si falla, el archivo queda huérfano pero la UI sigue consistente */
  }
}
