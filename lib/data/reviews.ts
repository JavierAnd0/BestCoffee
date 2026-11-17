// Reseñas públicas de un producto. La API las entrega dentro del detalle de
// producto (/v1/products/:slug → `reviews`, solo las APROBADAS).

import { cache } from "react";
import { env } from "../env";
import { apiServer } from "../api/client";
import { customerFetch } from "../api/gateway";
import { getCustomerSession } from "../auth/session-store";

export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reply: string | null;
  verifiedSubscriber: boolean;
  createdAt: string;
}

export interface ProductReviews {
  count: number;
  /** Media con un decimal; null si no hay reseñas aprobadas. */
  average: number | null;
  /** Cantidad por estrellas: índice 0 = 1★ … índice 4 = 5★. */
  distribution: [number, number, number, number, number];
  reviews: PublicReview[];
}

const EMPTY: ProductReviews = { count: 0, average: null, distribution: [0, 0, 0, 0, 0], reviews: [] };

export function summarizeReviews(reviews: PublicReview[]): ProductReviews {
  if (!reviews.length) return EMPTY;
  const distribution: ProductReviews["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    distribution[r.rating - 1] += 1;
  }
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
    distribution,
    reviews,
  };
}

export const getProductReviews = cache(async (slug: string): Promise<ProductReviews> => {
  if (env.useMocks) return EMPTY;
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/products/{slug}", {
      params: { path: { slug } },
    });
    if (error || !data) return EMPTY;
    const raw = (data as unknown as { reviews?: Partial<PublicReview>[] }).reviews ?? [];
    const reviews = raw
      .filter(
        (r): r is PublicReview =>
          typeof r.id === "string" &&
          typeof r.rating === "number" &&
          r.rating >= 1 &&
          r.rating <= 5 &&
          typeof r.body === "string",
      )
      .map((r) => ({
        id: r.id,
        rating: Math.round(r.rating),
        title: r.title ?? null,
        body: r.body,
        reply: r.reply ?? null,
        verifiedSubscriber: Boolean(r.verifiedSubscriber),
        createdAt: r.createdAt ?? "",
      }));
    return summarizeReviews(reviews);
  } catch {
    return EMPTY;
  }
});

/**
 * Correo del cliente con sesión verificada por el backend (/v1/customers/me), o
 * null. Nunca se toma de la cookie sin validar.
 */
export async function getVerifiedCustomerEmail(): Promise<string | null> {
  if (env.useMocks) return null;
  const { token, isMockSession } = await getCustomerSession();
  if (!token || isMockSession) return null;
  const res = await customerFetch<{ email?: string }>("/v1/customers/me");
  return res.ok && typeof res.data?.email === "string" ? res.data.email : null;
}
