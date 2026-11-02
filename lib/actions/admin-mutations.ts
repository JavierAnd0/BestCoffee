"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import type {
  GrindFormat,
  Product,
  ProductImage,
  ProductStatus,
  ProductType,
} from "../types";

export interface SaveProductInput {
  id?: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  type: ProductType;
  origin: string;
  producerStory: string;
  roastLevel: number;
  flavorNotes: string[];
  badges: string[];
  status: ProductStatus;
  subscriptionAvailability: Product["subscriptionAvailability"];
  variants: Array<{
    sizeGrams: number;
    grind: GrindFormat;
    priceOneTime: number;
    priceSubscription: number;
    stock: number;
  }>;
  pendingImages?: ProductImage[];
}

// Esquema mínimo que coincide con el DTO real de creación/edición de
// productos del backend (nombre + al menos una variante con precio válido).
const saveProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre del producto es obligatorio."),
  shortDescription: z.string().optional().default(""),
  longDescription: z.string().optional().default(""),
  type: z.string(),
  origin: z.string().optional().default(""),
  producerStory: z.string().optional().default(""),
  roastLevel: z.number(),
  flavorNotes: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  status: z.string(),
  subscriptionAvailability: z.unknown(),
  variants: z
    .array(
      z.object({
        sizeGrams: z.number().positive(),
        grind: z.string(),
        priceOneTime: z.number().nonnegative(),
        priceSubscription: z.number().nonnegative(),
        stock: z.number().nonnegative(),
      }),
    )
    .min(1, "El producto necesita al menos una variante válida."),
  pendingImages: z.array(z.unknown()).optional(),
});

export type AdminMutationResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; error: string };

export async function saveProductAction(
  input: SaveProductInput,
): Promise<AdminMutationResult<{ id: string }>> {
  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de producto inválidos." };
  }

  if (env.useMocks) {
    revalidatePath("/admin/productos");
    revalidatePath("/catalogo");
    return {
      ok: true,
      message: "Producto guardado correctamente.",
      data: { id: input.id ?? `prod_${Date.now()}` },
    };
  }

  const slug = input.name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const payload = {
    name: input.name.trim(),
    slug,
    shortDescription: input.shortDescription.trim(),
    longDescription: input.longDescription.trim(),
    type: input.type,
    origin: input.origin.trim(),
    producerStory: input.producerStory.trim(),
    roastLevel: input.roastLevel,
    flavorNotes: input.flavorNotes,
    badges: input.badges,
    status: input.status,
    subscriptionAvailability: input.subscriptionAvailability,
    variants: input.variants.map((v) => ({
      sizeGrams: v.sizeGrams,
      grind: v.grind,
      priceOneTimeCents: Math.round(v.priceOneTime * 100),
      priceSubscriptionCents: Math.round(v.priceSubscription * 100),
      priceOneTime: v.priceOneTime,
      priceSubscription: v.priceSubscription,
      stock: v.stock,
    })),
  };

  const isUpdate = Boolean(input.id);
  const path = isUpdate
    ? `/v1/admin/products/${encodeURIComponent(input.id!)}`
    : "/v1/admin/products";

  const res = await operatorFetch<{ id?: string }>(path, {
    method: isUpdate ? "PATCH" : "POST",
    body: payload,
  });

  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo guardar el producto." };
  }

  const productId = res.data?.id ?? input.id ?? slug;

  // Si es producto nuevo y había imágenes subidas a Blob pendientes de asociar
  if (!isUpdate && input.pendingImages?.length && res.data?.id) {
    for (const img of input.pendingImages) {
      await operatorFetch(`/v1/admin/products/${encodeURIComponent(res.data.id)}/images`, {
        method: "POST",
        body: { url: img.url, alt: img.alt },
      });
    }
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/catalogo");
  revalidatePath(`/p/${slug}`);

  return {
    ok: true,
    message: isUpdate
      ? "Producto actualizado correctamente."
      : "Producto creado correctamente.",
    data: { id: productId },
  };
}

export async function updateOrderStatusAction(
  orderId: string,
  patch: {
    status?: "RECEIVED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    trackingNumber?: string;
    internalNotes?: string;
  },
): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const res = await operatorFetch(
      `/v1/admin/orders/${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        body: patch,
      },
    );
    if (!res.ok && res.status !== 503) {
      return { ok: false, error: res.error || "No se pudo actualizar el pedido." };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true, message: "Pedido actualizado correctamente." };
}

export async function saveAdminSettingsAction(
  _prev: AdminMutationResult | null,
  formData: FormData,
): Promise<AdminMutationResult> {
  const payload = {
    freeShippingThresholdCop: Number(formData.get("freeShippingThresholdCop") ?? 45000),
    subscriptionDiscountPct: Number(formData.get("subscriptionDiscountPct") ?? 15),
    legalName: String(formData.get("legalName") ?? "").trim(),
    taxId: String(formData.get("taxId") ?? "").trim(),
    fiscalAddress: String(formData.get("fiscalAddress") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    instagramUrl: String(formData.get("instagramUrl") ?? "").trim(),
    tiktokUrl: String(formData.get("tiktokUrl") ?? "").trim(),
    xUrl: String(formData.get("xUrl") ?? "").trim(),
    youtubeUrl: String(formData.get("youtubeUrl") ?? "").trim(),
  };

  if (!env.useMocks) {
    const res = await operatorFetch("/v1/admin/settings", {
      method: "PATCH",
      body: payload,
    });
    if (!res.ok && res.status !== 503) {
      return {
        ok: false,
        error: res.error || "No se pudo guardar la configuración de la tienda.",
      };
    }
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/");
  return { ok: true, message: "Configuración guardada correctamente." };
}

export async function createDiscountCodeAction(
  _prev: AdminMutationResult | null,
  formData: FormData,
): Promise<AdminMutationResult> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "PERCENT") as
    | "PERCENT"
    | "FIXED"
    | "FREE_SHIPPING";
  const rawValue = Number(formData.get("value") ?? 0);
  const usesLimitRaw = String(formData.get("usesLimit") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();

  if (!code) {
    return { ok: false, error: "El código promocional es obligatorio." };
  }

  if (!env.useMocks) {
    const body: Record<string, unknown> = {
      code,
      type,
      active: true,
      ...(type === "PERCENT" ? { discountPct: rawValue } : {}),
      ...(type === "FIXED" ? { discountAmount: Math.round(rawValue * 100) } : {}),
      ...(usesLimitRaw ? { usesLimit: Number(usesLimitRaw) } : {}),
      ...(expiresAtRaw ? { expiresAt: expiresAtRaw } : {}),
    };

    const res = await operatorFetch("/v1/admin/discount-codes", {
      method: "POST",
      body,
    });

    if (!res.ok && res.status !== 503) {
      return { ok: false, error: res.error || "No se pudo crear el código de descuento." };
    }
  }

  revalidatePath("/admin/promociones");
  return { ok: true, message: `Código ${code} creado exitosamente.` };
}

export async function moderateReviewAction(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const res = await operatorFetch(
      `/v1/admin/reviews/${encodeURIComponent(reviewId)}`,
      {
        method: "PATCH",
        body: { status },
      },
    );
    if (!res.ok && res.status !== 503) {
      return { ok: false, error: res.error || "No se pudo actualizar la reseña." };
    }
  }

  revalidatePath("/admin/resenas");
  return {
    ok: true,
    message: status === "APPROVED" ? "Reseña aprobada." : "Reseña rechazada.",
  };
}
