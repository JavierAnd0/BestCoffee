// Data adapter for the Products domain. Today it serves mocks; when the
// backend is live, swap each function body to call apiServer() — pages don't
// change because they import from here, not from /mocks directly.
//
// Pattern for the swap (once api:types is regenerated):
//
//   import { apiServer } from "@/lib/api/client";
//   export async function listProducts() {
//     if (env.useMocks) return PRODUCTS;
//     const api = await apiServer();
//     const { data, error } = await api.GET("/v1/products");
//     if (error) throw new Error(`API products list failed`);
//     return data.items;
//   }

import { env } from "../env";
import { PRODUCTS, findProduct as findMock, bestsellers as bestMock } from "../mocks/products";
import type { Product } from "../types";

export async function listProducts(): Promise<Product[]> {
  if (env.useMocks) return PRODUCTS;
  throw new Error("listProducts: live API not wired yet — run pnpm api:types and update lib/data/products.ts");
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (env.useMocks) return findMock(slug);
  throw new Error("getProductBySlug: live API not wired yet");
}

export async function listBestsellers(): Promise<Product[]> {
  if (env.useMocks) return bestMock();
  throw new Error("listBestsellers: live API not wired yet");
}

export async function listRelated(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  if (env.useMocks) {
    return PRODUCTS.filter((p) => p.slug !== product.slug && p.type === product.type).slice(0, limit);
  }
  throw new Error("listRelated: live API not wired yet");
}
