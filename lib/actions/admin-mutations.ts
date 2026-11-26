"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import type { AdminShippingAddress } from "../data/admin";
import type {
  GrindFormat,
  Product,
  ProductImage,
  ProductStatus,
  ProductType,
} from "../types";

/**
 * Montos: la API guarda y devuelve todo en centavos COP (ver
 * `CreateVariantDto`, `formatCop`). El panel muestra y recibe pesos; la
 * conversión se hace solo aquí (al guardar) y en el formulario (al cargar).
 */
const toCents = (pesos: number) => Math.round(pesos * 100);

type VariantField = "priceOneTime" | "priceSubscription" | "compareAt" | "stock";

export interface SaveProductInput {
  id?: string;
  name: string;
  description: string;
  type: ProductType;
  origin: string;
  producerStory: string;
  roastLevel: number;
  flavorNotes: string[];
  badges: string[];
  status: ProductStatus;
  subscriptionAvailability: Product["subscriptionAvailability"];
  /** Precios en pesos COP (lo que escribe el operador). */
  variants: Array<{
    sizeGrams: number;
    grind: GrindFormat;
    priceOneTime: number;
    /** 0 = sin precio de suscripción. */
    priceSubscription: number;
    /** Precio "antes" (tachado en la tienda). 0 = sin rebaja. */
    compareAt: number;
    stock: number;
    /**
     * Campos que el operador no tocó en esa presentación: en una variante que
     * ya existe se dejan como están (p. ej. el stock propio de cada molienda).
     */
    preserve?: VariantField[];
  }>;
  pendingImages?: ProductImage[];
}

const saveProductSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, "El nombre del producto debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede pasar de 120 caracteres."),
  description: z.string().max(2000, "La descripción no puede pasar de 2.000 caracteres."),
  type: z.enum(["BLEND", "SINGLE_ORIGIN", "DECAF", "ACCESSORY"]),
  origin: z.string().max(120, "El origen no puede pasar de 120 caracteres."),
  producerStory: z.string().max(4000, "La historia no puede pasar de 4.000 caracteres."),
  roastLevel: z.number().int().min(1).max(9),
  flavorNotes: z.array(z.string()).max(12, "Máximo 12 notas de sabor."),
  badges: z.array(z.string()).max(8),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  subscriptionAvailability: z.enum(["YES", "NO", "SUBSCRIPTION_ONLY"]),
  variants: z
    .array(
      z.object({
        sizeGrams: z.number().int("El tamaño debe ser un número entero de gramos.").positive("El tamaño debe ser mayor que 0."),
        grind: z.enum(["WHOLE_BEAN", "ESPRESSO", "FILTER", "FRENCH_PRESS"]),
        priceOneTime: z.number().positive("Cada tamaño necesita un precio mayor que 0."),
        priceSubscription: z.number().nonnegative("El precio de suscripción no puede ser negativo."),
        compareAt: z.number().nonnegative("El precio anterior no puede ser negativo."),
        stock: z.number().int("El stock debe ser un número entero.").nonnegative("El stock no puede ser negativo."),
        preserve: z.array(z.enum(["priceOneTime", "priceSubscription", "compareAt", "stock"])).optional(),
      })
      .refine((v) => v.compareAt === 0 || v.compareAt > v.priceOneTime, {
        message: "El precio anterior debe ser mayor que el precio actual.",
      }),
    )
    .min(1, "El producto necesita al menos un tamaño y una molienda."),
  pendingImages: z.array(z.object({ url: z.string(), alt: z.string().optional() }).passthrough()).optional(),
});

export type AdminMutationResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; error: string };

interface ApiVariantRow {
  id: string;
  sizeGrams: number;
  grind: string;
  priceOneTime: number;
  priceSubscription: number | null;
  compareAtPrice?: number | null;
  stock: number;
}

interface ApiProductRow {
  id: string;
  slug: string;
  variants?: ApiVariantRow[];
}

const variantKey = (sizeGrams: number, grind: string) => `${sizeGrams}|${grind}`;

const GRIND_LABEL: Record<string, string> = {
  WHOLE_BEAN: "grano",
  ESPRESSO: "espresso",
  FILTER: "filtro",
  FRENCH_PRESS: "prensa francesa",
};

export async function saveProductAction(
  input: SaveProductInput,
): Promise<AdminMutationResult<{ id: string }>> {
  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de producto inválidos." };
  }
  const p = parsed.data;

  const keys = p.variants.map((v) => variantKey(v.sizeGrams, v.grind));
  if (new Set(keys).size !== keys.length) {
    return { ok: false, error: "Hay tamaños repetidos: cada tamaño debe aparecer una sola vez." };
  }

  if (env.useMocks) {
    revalidatePath("/admin/productos");
    return {
      ok: true,
      message: "Producto guardado correctamente.",
      data: { id: input.id ?? `prod_${Date.now()}` },
    };
  }

  // Campos de `CreateProductDto` / `UpdateProductDto` (sin slug: la API lo
  // deriva del nombre y lo hace único; cambiarlo rompería enlaces ya compartidos).
  const fields = {
    name: p.name.trim(),
    type: p.type,
    description: p.description.trim(),
    origin: p.origin.trim(),
    producerStory: p.producerStory.trim(),
    roastLevel: p.roastLevel,
    flavorNotes: p.flavorNotes,
    badges: p.badges,
    status: p.status,
    subscriptionAvailability: p.subscriptionAvailability,
  };

  const variantBody = (v: (typeof p.variants)[number]) => ({
    sizeGrams: v.sizeGrams,
    grind: v.grind,
    priceOneTime: toCents(v.priceOneTime),
    ...(v.priceSubscription > 0 ? { priceSubscription: toCents(v.priceSubscription) } : {}),
    ...(v.compareAt > 0 ? { compareAtPrice: toCents(v.compareAt) } : {}),
    stock: v.stock,
  });

  // ── Alta ───────────────────────────────────────────────────────────────────
  if (!p.id) {
    const body = {
      ...fields,
      // En el alta, vacío = no enviar (la API guarda null).
      description: fields.description || undefined,
      origin: fields.origin || undefined,
      producerStory: fields.producerStory || undefined,
      variants: p.variants.map(variantBody),
    };
    const res = await operatorFetch<ApiProductRow>("/v1/admin/products", {
      method: "POST",
      body,
    });
    if (!res.ok) {
      return { ok: false, error: res.error || "No se pudo crear el producto." };
    }

    const failedImages: string[] = [];
    for (const img of p.pendingImages ?? []) {
      const r = await operatorFetch(
        `/v1/admin/products/${encodeURIComponent(res.data.id)}/images`,
        { method: "POST", body: { url: img.url, ...(img.alt ? { alt: img.alt } : {}) } },
      );
      if (!r.ok) failedImages.push(r.error);
    }

    revalidateProduct(res.data.id, res.data.slug);
    if (failedImages.length > 0) {
      return {
        ok: false,
        error: `El producto se creó, pero ${failedImages.length} imagen(es) no se pudieron asociar: ${failedImages[0]}. Edítalo para volver a subirlas.`,
      };
    }
    return { ok: true, message: "Producto creado correctamente.", data: { id: res.data.id } };
  }

  // ── Edición: datos del producto y luego variantes (la API las gestiona aparte) ──
  const id = encodeURIComponent(p.id);
  const current = await operatorFetch<ApiProductRow>(`/v1/admin/products/${id}`);
  if (!current.ok) {
    return { ok: false, error: current.error || "No se encontró el producto." };
  }

  const res = await operatorFetch<ApiProductRow>(`/v1/admin/products/${id}`, {
    method: "PATCH",
    body: fields,
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo actualizar el producto." };
  }

  const existing = new Map(
    (current.data.variants ?? []).map((v) => [variantKey(v.sizeGrams, v.grind), v]),
  );
  const errors: string[] = [];
  const label = (sizeGrams: number, grind: string) =>
    `${sizeGrams} g ${GRIND_LABEL[grind] ?? grind}`;

  for (const v of p.variants) {
    const key = variantKey(v.sizeGrams, v.grind);
    const prev = existing.get(key);
    if (!prev) {
      const r = await operatorFetch(`/v1/admin/products/${id}/variants`, {
        method: "POST",
        body: variantBody(v),
      });
      if (!r.ok) errors.push(`${label(v.sizeGrams, v.grind)}: ${r.error}`);
      continue;
    }
    existing.delete(key);
    const keep = new Set(v.preserve ?? []);
    const patch: Record<string, number | null> = {};
    const nextOneTime = toCents(v.priceOneTime);
    if (!keep.has("priceOneTime") && nextOneTime !== prev.priceOneTime) {
      patch.priceOneTime = nextOneTime;
    }
    // Vacío o 0 = sin suscripción. Quitarlo no afecta a las suscripciones que
    // ya existen (cada renovación usa el precio de su primer pedido); solo
    // impide suscribirse de nuevo a esta presentación.
    if (!keep.has("priceSubscription")) {
      const nextSub = v.priceSubscription > 0 ? toCents(v.priceSubscription) : null;
      if (nextSub !== (prev.priceSubscription ?? null)) patch.priceSubscription = nextSub;
    }
    // Vacío o 0 = sin rebaja (null la quita en la API).
    if (!keep.has("compareAt")) {
      const nextCompare = v.compareAt > 0 ? toCents(v.compareAt) : null;
      if (nextCompare !== (prev.compareAtPrice ?? null)) patch.compareAtPrice = nextCompare;
    }
    if (!keep.has("stock") && v.stock !== prev.stock) patch.stock = v.stock;
    if (Object.keys(patch).length === 0) continue;
    const r = await operatorFetch(
      `/v1/admin/products/variants/${encodeURIComponent(prev.id)}`,
      { method: "PATCH", body: patch },
    );
    if (!r.ok) errors.push(`${label(v.sizeGrams, v.grind)}: ${r.error}`);
  }

  // Presentaciones que el operador quitó del formulario.
  for (const v of existing.values()) {
    const r = await operatorFetch(
      `/v1/admin/products/variants/${encodeURIComponent(v.id)}`,
      { method: "DELETE" },
    );
    if (!r.ok) {
      // La API explica por qué (suscripciones o regalos que la usan).
      errors.push(`${label(v.sizeGrams, v.grind)}: ${r.error || "no se pudo eliminar."}`);
    }
  }

  revalidateProduct(p.id, res.data.slug);
  if (errors.length > 0) {
    return {
      ok: false,
      error: `Los datos del producto se guardaron, pero algunas variantes no: ${errors.join(" · ")}`,
    };
  }
  return { ok: true, message: "Producto actualizado correctamente.", data: { id: p.id } };
}

function revalidateProduct(id: string, slug?: string) {
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/catalogo");
  if (slug) revalidatePath(`/p/${slug}`);
}

/**
 * Cambios del pedido desde su detalle. El backend separa el estado
 * (`PATCH /:id/status`, con sus transiciones) del resto (`PATCH /:id`: pago,
 * enlace de seguimiento, notas y dirección), y rechaza campos que no conoce.
 */
export async function updateOrderStatusAction(
  orderId: string,
  patch: {
    status?: "RECEIVED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    /** Número de guía o enlace de seguimiento (la API lo guarda en `trackingUrl`). */
    trackingNumber?: string;
    internalNotes?: string;
    shippingAddress?: AdminShippingAddress;
  },
): Promise<AdminMutationResult> {
  const id = encodeURIComponent(orderId);
  if (!env.useMocks) {
    if (patch.status) {
      const res = await operatorFetch(`/v1/admin/orders/${id}/status`, {
        method: "PATCH",
        body: {
          status: patch.status,
          ...(patch.trackingNumber?.trim() ? { trackingUrl: patch.trackingNumber.trim() } : {}),
        },
      });
      if (!res.ok) return { ok: false, error: res.error || "No se pudo cambiar el estado." };
    }

    const rest: Record<string, unknown> = {};
    if (patch.trackingNumber !== undefined && !patch.status) {
      rest.trackingUrl = patch.trackingNumber.trim();
    }
    if (patch.internalNotes !== undefined) rest.internalNotes = patch.internalNotes;
    if (patch.shippingAddress) {
      const a = patch.shippingAddress;
      const opt = (v: string) => v.trim() || undefined;
      if (a.line1.trim().length < 3 || a.city.trim().length < 2) {
        return { ok: false, error: "La dirección y la ciudad son obligatorias." };
      }
      rest.shippingAddress = {
        recipientName: opt(a.recipientName),
        line1: a.line1.trim(),
        line2: opt(a.line2),
        city: a.city.trim(),
        state: opt(a.state),
        postalCode: opt(a.postalCode),
        phone: opt(a.phone),
        country: "CO",
      };
    }
    if (Object.keys(rest).length > 0) {
      const res = await operatorFetch(`/v1/admin/orders/${id}`, { method: "PATCH", body: rest });
      if (!res.ok) return { ok: false, error: res.error || "No se pudo actualizar el pedido." };
    }
  }

  revalidateOrder(orderId);
  return {
    ok: true,
    message: patch.shippingAddress ? "Dirección actualizada." : "Pedido actualizado correctamente.",
  };
}

/**
 * Confirma a mano que el cliente pagó (transferencia, contra entrega…).
 * La API liquida el pedido: descuenta inventario, cuenta el cupón y envía la
 * confirmación. Es idempotente y rechaza pedidos cancelados o reembolsados.
 */
export async function markOrderPaidAction(orderId: string): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const res = await operatorFetch(`/v1/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      body: { paymentStatus: "PAID" },
    });
    if (!res.ok) return { ok: false, error: res.error || "No se pudo marcar el pedido como pagado." };
  }
  revalidateOrder(orderId);
  return { ok: true, message: "Pago confirmado. Se descontó el inventario y se avisó al cliente." };
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

/** Pesos escritos por el operador ("45.000", "45000") → centavos; `undefined` si está vacío. */
function pesosField(formData: FormData, name: string): number | undefined | "invalid" {
  const raw = String(formData.get(name) ?? "").replace(/[.\s$]/g, "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return "invalid";
  return toCents(n);
}

/**
 * Guarda la configuración del dueño con los nombres de `UpdateSettingsDto`:
 * nombre, envío (`features`) y datos de la empresa (`branding`).
 */
export async function saveAdminSettingsAction(
  _prev: AdminMutationResult | null,
  formData: FormData,
): Promise<AdminMutationResult> {
  const str = (name: string) => String(formData.get(name) ?? "").trim();
  const name = str("name");
  if (name.length < 2) {
    return { ok: false, error: "El nombre de la tienda es obligatorio." };
  }
  const threshold = pesosField(formData, "freeShippingThreshold");
  const flat = pesosField(formData, "shippingFlat");
  if (threshold === "invalid" || flat === "invalid") {
    return { ok: false, error: "Los montos de envío deben ser números enteros en pesos." };
  }

  const payload = {
    name,
    shipping: {
      ...(threshold !== undefined ? { freeShippingThresholdCents: threshold } : {}),
      ...(flat !== undefined ? { shippingFlatCents: flat } : {}),
    },
    // Cadena vacía = borrar el dato (la API fusiona el objeto).
    branding: {
      legalName: str("legalName"),
      legalId: str("legalId"),
      contactEmail: str("contactEmail"),
      contactPhone: str("contactPhone"),
      city: str("city"),
    },
  };

  if (!env.useMocks) {
    const res = await operatorFetch("/v1/admin/settings", {
      method: "PATCH",
      body: payload,
    });
    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status === 403
            ? "Solo el dueño de la tienda puede cambiar la configuración."
            : res.error || "No se pudo guardar la configuración de la tienda.",
      };
    }
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada correctamente." };
}

/** Crea un cupón con los nombres de `CreateDiscountCodeDto`. */
export async function createDiscountCodeAction(
  _prev: AdminMutationResult | null,
  formData: FormData,
): Promise<AdminMutationResult> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const type = String(formData.get("type") ?? "PERCENTAGE");
  const rawValue = Number(String(formData.get("value") ?? "").replace(/[.\s$]/g, ""));
  const maxRaw = String(formData.get("maxRedemptions") ?? "").trim();
  const minRaw = String(formData.get("minSubtotal") ?? "").replace(/[.\s$]/g, "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return {
      ok: false,
      error: "El código debe tener de 3 a 40 caracteres: letras, números, guion o guion bajo.",
    };
  }
  if (type !== "PERCENTAGE" && type !== "FIXED") {
    return { ok: false, error: "Tipo de descuento no válido." };
  }
  if (!Number.isInteger(rawValue) || rawValue < 1) {
    return { ok: false, error: "El valor del descuento debe ser un número entero mayor que 0." };
  }
  if (type === "PERCENTAGE" && rawValue > 100) {
    return { ok: false, error: "Un porcentaje no puede pasar de 100." };
  }
  const maxRedemptions = maxRaw ? Number(maxRaw) : undefined;
  if (maxRedemptions !== undefined && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
    return { ok: false, error: "El límite de usos debe ser un número entero mayor que 0." };
  }
  const minSubtotal = minRaw ? Number(minRaw) : undefined;
  if (minSubtotal !== undefined && (!Number.isInteger(minSubtotal) || minSubtotal < 0)) {
    return { ok: false, error: "La compra mínima debe ser un número entero en pesos." };
  }

  const body = {
    code,
    type,
    // PERCENTAGE: 1-100 · FIXED: centavos COP (el operador escribe pesos).
    value: type === "FIXED" ? toCents(rawValue) : rawValue,
    active: true,
    ...(maxRedemptions !== undefined ? { maxRedemptions } : {}),
    ...(minSubtotal ? { minSubtotalCents: toCents(minSubtotal) } : {}),
    // Vence al final del día elegido (hora de Colombia, UTC-5).
    ...(endsAtRaw ? { endsAt: new Date(`${endsAtRaw}T23:59:59-05:00`).toISOString() } : {}),
  };

  if (!env.useMocks) {
    const res = await operatorFetch("/v1/admin/discount-codes", { method: "POST", body });
    if (!res.ok) {
      return { ok: false, error: res.error || "No se pudo crear el código de descuento." };
    }
  }

  revalidatePath("/admin/promociones");
  return { ok: true, message: `Código ${code} creado.` };
}

export async function setDiscountCodeActiveAction(
  id: string,
  active: boolean,
): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const res = await operatorFetch(`/v1/admin/discount-codes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { active },
    });
    if (!res.ok) return { ok: false, error: res.error || "No se pudo actualizar el código." };
  }
  revalidatePath("/admin/promociones");
  return { ok: true, message: active ? "Código activado." : "Código desactivado." };
}

export async function deleteDiscountCodeAction(id: string): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const res = await operatorFetch(`/v1/admin/discount-codes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) return { ok: false, error: res.error || "No se pudo eliminar el código." };
  }
  revalidatePath("/admin/promociones");
  return { ok: true, message: "Código eliminado." };
}

/** Moderación: la API expone `POST /v1/admin/reviews/:id/approve` y `/reject`. */
export async function moderateReviewAction(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
): Promise<AdminMutationResult> {
  if (!env.useMocks) {
    const verb = status === "APPROVED" ? "approve" : "reject";
    const res = await operatorFetch(
      `/v1/admin/reviews/${encodeURIComponent(reviewId)}/${verb}`,
      { method: "POST", ...(status === "APPROVED" ? { body: {} } : {}) },
    );
    if (!res.ok) {
      return { ok: false, error: res.error || "No se pudo actualizar la reseña." };
    }
  }

  revalidatePath("/admin/resenas");
  return {
    ok: true,
    message: status === "APPROVED" ? "Reseña aprobada." : "Reseña rechazada.",
  };
}
