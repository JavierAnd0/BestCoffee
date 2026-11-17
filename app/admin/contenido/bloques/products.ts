import { listAdminProducts } from "@/lib/data/admin";
import type { ProductOption } from "./block-form";

/** Productos de la tienda para elegir en los bloques destacados. */
export async function productOptions(): Promise<ProductOption[]> {
  const products = await listAdminProducts().catch(() => []);
  return products.map((p) => ({ slug: p.slug, name: p.name }));
}
