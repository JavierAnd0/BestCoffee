"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { operatorFetch } from "../api/gateway";

// Mutaciones de colecciones contra /v1/admin/collections (rol TENANT_EDITOR).
// Los cuerpos coinciden con CreateCollectionDto / UpdateCollectionDto,
// AttachProductsDto y ReorderProductsDto del backend.

export type CollectionMutationResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

const PRODUCT_TYPES = ["SINGLE_ORIGIN", "BLEND", "DECAF", "ACCESSORY"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const roast = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : Number(v)))
  .pipe(z.number().int().min(1).max(9).optional());

const collectionSchema = z
  .object({
    id: optionalText(64),
    name: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), {
        message: "El slug solo admite minúsculas, números y guiones.",
      })
      .transform((v) => (v === "" ? undefined : v)),
    description: z.string().trim().max(500),
    type: z.enum(["MANUAL", "AUTO"]),
    position: z
      .string()
      .trim()
      .transform((v) => (v === "" ? 0 : Number(v)))
      .pipe(z.number().int().min(0)),
    ruleType: z
      .string()
      .transform((v) => (v === "" ? undefined : v))
      .pipe(z.enum(PRODUCT_TYPES).optional()),
    roastLevelGte: roast,
    roastLevelLte: roast,
    flavorNote: optionalText(80),
    badge: optionalText(80),
  })
  .superRefine((v, ctx) => {
    if (v.roastLevelGte && v.roastLevelLte && v.roastLevelGte > v.roastLevelLte) {
      ctx.addIssue({ code: "custom", message: "El tueste mínimo no puede superar al máximo." });
    }
    if (
      v.type === "AUTO" &&
      !v.ruleType &&
      !v.roastLevelGte &&
      !v.roastLevelLte &&
      !v.flavorNote &&
      !v.badge
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Una colección automática necesita al menos una regla.",
      });
    }
  });

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

function revalidateCollections(id?: string) {
  revalidatePath("/admin/colecciones");
  if (id) revalidatePath(`/admin/colecciones/${id}`);
  revalidatePath("/colecciones", "layout");
}

const idSchema = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

/** Crea o edita una colección (con `id` edita). */
export async function saveCollectionAction(
  _prev: CollectionMutationResult | null,
  formData: FormData,
): Promise<CollectionMutationResult> {
  const parsed = collectionSchema.safeParse({
    id: field(formData, "id"),
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    type: field(formData, "type") || "MANUAL",
    position: field(formData, "position"),
    ruleType: field(formData, "ruleType"),
    roastLevelGte: field(formData, "roastLevelGte"),
    roastLevelLte: field(formData, "roastLevelLte"),
    flavorNote: field(formData, "flavorNote"),
    badge: field(formData, "badge"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const v = parsed.data;
  if (v.id && !idSchema.safeParse(v.id).success) {
    return { ok: false, error: "Colección no válida." };
  }

  const body: Record<string, unknown> = {
    name: v.name,
    description: v.description,
    type: v.type,
    position: v.position,
    ...(v.slug && { slug: v.slug }),
  };
  if (v.type === "AUTO") {
    body.rules = {
      ...(v.ruleType && { type: v.ruleType }),
      ...(v.roastLevelGte && { roastLevelGte: v.roastLevelGte }),
      ...(v.roastLevelLte && { roastLevelLte: v.roastLevelLte }),
      ...(v.flavorNote && { flavorNote: v.flavorNote }),
      ...(v.badge && { badge: v.badge }),
    };
  }

  const res = await operatorFetch<{ id: string; slug: string }>(
    v.id ? `/v1/admin/collections/${encodeURIComponent(v.id)}` : "/v1/admin/collections",
    { method: v.id ? "PATCH" : "POST", body },
  );
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo guardar la colección." };
  }
  const id = res.data?.id ?? v.id;
  revalidateCollections(id);
  return { ok: true, message: v.id ? "Colección actualizada." : "Colección creada.", id };
}

export async function deleteCollectionAction(id: string): Promise<CollectionMutationResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Colección no válida." };
  const res = await operatorFetch(`/v1/admin/collections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo eliminar la colección." };
  revalidateCollections();
  return { ok: true, message: "Colección eliminada." };
}

export async function attachCollectionProductsAction(
  id: string,
  productIds: string[],
): Promise<CollectionMutationResult> {
  const ids = z.array(idSchema).min(1).max(200).safeParse(productIds);
  if (!idSchema.safeParse(id).success || !ids.success) {
    return { ok: false, error: "Selecciona al menos un producto." };
  }
  const res = await operatorFetch(`/v1/admin/collections/${encodeURIComponent(id)}/products`, {
    method: "POST",
    body: { productIds: ids.data },
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudieron añadir los productos." };
  revalidateCollections(id);
  return {
    ok: true,
    message: ids.data.length === 1 ? "Producto añadido." : `${ids.data.length} productos añadidos.`,
  };
}

export async function detachCollectionProductAction(
  id: string,
  productId: string,
): Promise<CollectionMutationResult> {
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(productId).success) {
    return { ok: false, error: "Producto no válido." };
  }
  const res = await operatorFetch(
    `/v1/admin/collections/${encodeURIComponent(id)}/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) return { ok: false, error: res.error || "No se pudo quitar el producto." };
  revalidateCollections(id);
  return { ok: true, message: "Producto quitado de la colección." };
}

/** Guarda el orden completo de los productos de una colección MANUAL. */
export async function reorderCollectionProductsAction(
  id: string,
  productIds: string[],
): Promise<CollectionMutationResult> {
  const ids = z.array(idSchema).min(1).max(500).safeParse(productIds);
  if (!idSchema.safeParse(id).success || !ids.success) {
    return { ok: false, error: "Orden no válido." };
  }
  const res = await operatorFetch(
    `/v1/admin/collections/${encodeURIComponent(id)}/products/reorder`,
    { method: "PATCH", body: { productIds: ids.data } },
  );
  if (!res.ok) return { ok: false, error: res.error || "No se pudo guardar el orden." };
  revalidateCollections(id);
  return { ok: true, message: "Orden guardado." };
}
