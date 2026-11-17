"use server";

import { z } from "zod";
import { customerFetch } from "../api/gateway";
import { getCurrentTenant } from "../data/tenant";
import { getVerifiedCustomerEmail } from "../data/reviews";

// Alta de reseña: POST /v1/reviews (CreateReviewDto). La API no exige sesión ni
// compra: pide un correo, la deja PENDIENTE y solo se publica tras moderación.
// Con sesión iniciada se usa el correo verificado de la cuenta, no el del formulario.

export type ReviewFormState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

const schema = z.object({
  productSlug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/),
  rating: z.coerce.number().int().min(1, "Elige una puntuación de 1 a 5.").max(5),
  title: z
    .string()
    .trim()
    .max(120, "El título admite hasta 120 caracteres.")
    .transform((v) => (v === "" ? undefined : v)),
  body: z
    .string()
    .trim()
    .min(3, "Cuéntanos un poco más (mínimo 3 caracteres).")
    .max(2000, "La reseña admite hasta 2000 caracteres."),
  email: z.string().trim().toLowerCase().max(254),
});

export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const tenant = await getCurrentTenant();
  if (!tenant.features.reviews) {
    return { ok: false, error: "Esta tienda no recibe reseñas." };
  }

  const parsed = schema.safeParse({
    productSlug: formData.get("productSlug") ?? "",
    rating: formData.get("rating") ?? 0,
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos de la reseña." };
  }
  const v = parsed.data;

  const sessionEmail = await getVerifiedCustomerEmail();
  const email = sessionEmail ?? v.email;
  if (!z.email().safeParse(email).success) {
    return { ok: false, error: "Escribe un correo válido." };
  }

  const res = await customerFetch<{ id: string; status: string }>("/v1/reviews", {
    method: "POST",
    body: {
      productSlug: v.productSlug,
      email,
      rating: v.rating,
      ...(v.title && { title: v.title }),
      body: v.body,
    },
  });
  if (!res.ok) {
    if (res.status === 429) {
      return { ok: false, error: "Demasiados envíos seguidos. Inténtalo de nuevo en un minuto." };
    }
    return { ok: false, error: res.error || "No se pudo enviar la reseña." };
  }
  return {
    ok: true,
    message:
      "¡Gracias! Recibimos tu reseña. Quedará pendiente de moderación y se publicará cuando la tienda la apruebe.",
  };
}
