import { ProductCard } from "@/components/storefront/product-card";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listProducts } from "@/lib/data/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  const products = await listProducts();
  const allNotes = Array.from(
    new Set(products.flatMap((p) => p.flavorNotes)),
  ).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <nav className="text-xs text-muted-foreground mb-2">Inicio / Catálogo</nav>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8 lg:mb-12">
        <div>
          <Eyebrow>Todo el café</Eyebrow>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            Catálogo
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
          <span>{products.length} productos</span>
          <button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:border-foreground/30 transition-colors">
            Ordenar: Destacados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <CatalogFilters allNotes={allNotes} />

        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} imageHeight={200} />
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Mostrando {products.length} de {products.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
