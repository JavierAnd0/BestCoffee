// Data adapter for the Products domain. Live API by default; mocks when
// USE_MOCKS=true. Pages import from here, never from /mocks directly, so the
// API wiring lives in one place.

import { env } from "../env";
import { apiServer } from "../api/client";
import { mapProduct, type ApiProduct } from "../api/mappers";
import { PRODUCTS, findProduct as findMock, bestsellers as bestMock } from "../mocks/products";
import type { Product } from "../types";

export async function listProducts(): Promise<Product[]> {
  if (env.useMocks) return PRODUCTS;
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/products");
  if (error || !data) throw new Error("API GET /v1/products failed");
  const items = (data as unknown as { items: ApiProduct[] }).items ?? [];
  return items.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (env.useMocks) return findMock(slug);
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/products/{slug}", {
    params: { path: { slug } },
  });
  if (error || !data) return undefined;
  return mapProduct(data as unknown as ApiProduct);
}

export async function listBestsellers(): Promise<Product[]> {
  if (env.useMocks) return bestMock();
  // No dedicated bestsellers endpoint yet — surface the first active products.
  const all = await listProducts();
  const flagged = all.filter((p) =>
    p.badges.some((b) => /vendido|bestseller|destacado/i.test(b)),
  );
  return (flagged.length ? flagged : all).slice(0, 8);
}

export async function listRelated(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  if (env.useMocks) {
    return PRODUCTS.filter((p) => p.slug !== product.slug && p.type === product.type).slice(0, limit);
  }
  const all = await listProducts();
  const sameType = all.filter((p) => p.slug !== product.slug && p.type === product.type);
  const pool = sameType.length ? sameType : all.filter((p) => p.slug !== product.slug);
  return pool.slice(0, limit);
}
