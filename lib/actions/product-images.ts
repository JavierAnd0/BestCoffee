"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { env } from "../env";
import type { ProductImage } from "../types";

// Server actions para la galería de un producto. El archivo ya está en Vercel
// Blob (lo sube el navegador vía /api/admin/blob-upload); aquí solo se registra,
// reordena o elimina la referencia en la API.

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function adminHeaders(): Promise<Record<string, string>> {
  const c = await cookies();
  const h = await headers();
  const token =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value;
  return {
    "Content-Type": "application/json",
    "X-Tenant-Slug": h.get("x-tenant-slug") ?? env.defaultTenantSlug,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function callApi(
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ ok: true; json: unknown } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}${path}`, {
      method: init.method,
      headers: await adminHeaders(),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* respuesta sin cuerpo */
  }
  if (!res.ok) {
    const msg = (json as { message?: unknown } | null)?.message;
    return { ok: false, error: typeof msg === "string" ? msg : "No se pudo guardar la imagen." };
  }
  return { ok: true, json };
}

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
  const r = await callApi(`/v1/admin/products/${productId}/images`, {
    method: "POST",
    body: { url, alt },
  });
  if (!r.ok) return r;
  const img = r.json as Partial<ProductImage> | null;
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
  const r = await callApi(`/v1/admin/products/${productId}/images/reorder`, {
    method: "PATCH",
    body: { imageIds },
  });
  if (!r.ok) return r;
  revalidateProduct(productId);
  return { ok: true, data: undefined };
}

export async function removeProductImageAction(
  productId: string,
  imageId: string,
  url: string,
): Promise<Result> {
  if (!env.useMocks) {
    const r = await callApi(`/v1/admin/products/images/${imageId}`, { method: "DELETE" });
    if (!r.ok) return r;
    revalidateProduct(productId);
  }
  await deleteBlobAction(url);
  return { ok: true, data: undefined };
}

/** Borra el archivo de Vercel Blob. Ignora URLs que no son de Blob (p.ej. /img/...). */
export async function deleteBlobAction(url: string): Promise<void> {
  if (!url.includes(".blob.vercel-storage.com")) return;
  // Es una server action pública: exigir sesión de operador.
  const c = await cookies();
  const session =
    c.get("bestcoffee-impersonation")?.value ??
    c.get("bestcoffee-operator-session")?.value;
  if (!session) return;
  try {
    await del(url);
  } catch {
    /* si falla, el archivo queda huérfano pero la UI sigue consistente */
  }
}
