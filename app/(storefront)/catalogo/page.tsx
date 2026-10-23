import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { CatalogPagination } from "@/components/storefront/catalog-pagination";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listProducts } from "@/lib/data/products";
import { getCurrentTenant } from "@/lib/data/tenant";
import { Coffee, Wrench, Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Catálogo Completo · Café y Accesorios",
  description:
    "Explora nuestros lotes de café de especialidad tostados bajo pedido y nuestra línea de accesorios de barismo.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams?: Promise<{
    coleccion?: string;
    categoria?: string;
    pagina?: string;
    page?: string;
  }>;
}) {
  const { coleccion, categoria, pagina, page } = (await searchParams) ?? {};
  const activeCategory = (categoria || coleccion || "todo").toLowerCase();

  const [allProducts, tenant] = await Promise.all([
    listProducts(),
    getCurrentTenant(),
  ]);

  const hasAccessories = tenant.features.accessories !== false;

  // Filtrar productos según categoría y disponibilidad de accesorios en el tenant
  const products = allProducts.filter((p) => {
    if (!hasAccessories && p.type === "ACCESSORY") return false;

    if (activeCategory === "accesorios") {
      return p.type === "ACCESSORY" || p.collectionSlugs.includes("accesorios");
    }
    if (activeCategory === "cafe") {
      return p.type !== "ACCESSORY";
    }
    return true;
  });

  const PAGE_SIZE = 9;
  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const rawPage = parseInt(pagina || page || "1", 10);
  const currentPage = Math.min(
    Math.max(1, isNaN(rawPage) ? 1 : rawPage),
    totalPages,
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalProducts);
  const paginatedProducts = products.slice(startIndex, endIndex);

  const allNotes = Array.from(
    new Set(products.flatMap((p) => p.flavorNotes)),
  ).sort();

  const isAccessoriesView = activeCategory === "accesorios";
  const isCoffeeView = activeCategory === "cafe";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Migas de pan */}
      <nav className="text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>{" "}
        /{" "}
        <span className="text-foreground">
          {isAccessoriesView
            ? "Accesorios"
            : isCoffeeView
            ? "Café en grano"
            : "Catálogo"}
        </span>
      </nav>

      {/* Encabezado dinámico */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <Eyebrow>
            {isAccessoriesView
              ? "Herramientas de Barismo"
              : isCoffeeView
              ? "Cosechas & Mezclas"
              : "Selección de Especialidad"}
          </Eyebrow>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            {isAccessoriesView
              ? "Accesorios y Métodos"
              : isCoffeeView
              ? "Café en grano"
              : "Catálogo"}
          </h1>
        </div>

        {hasAccessories && (
          <Link
            href="/accesorios"
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            Ver vista dedicada de accesorios <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {/* Pestañas de categoría (Café vs Accesorios) */}
      <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-border">
        <Link
          href="/catalogo"
          className={
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all " +
            (activeCategory === "todo"
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground")
          }
        >
          <Sparkles className="size-3.5" />
          Todos los productos
        </Link>

        <Link
          href="/catalogo?categoria=cafe"
          className={
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all " +
            (isCoffeeView
              ? "bg-foreground text-background shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground")
          }
        >
          <Coffee className="size-3.5" />
          Cafés en grano
        </Link>

        {hasAccessories && (
          <Link
            href="/catalogo?categoria=accesorios"
            className={
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all " +
              (isAccessoriesView
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <Wrench className="size-3.5" />
            Accesorios y Equipos
          </Link>
        )}
      </div>

      {/* Rejilla de productos con filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <CatalogFilters allNotes={allNotes} />

        <div>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No hay productos que coincidan con los criterios seleccionados.
              </p>
              <Link href="/catalogo" className="mt-4 inline-block text-xs text-primary underline">
                Ver todo el catálogo
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} imageHeight={200} />
                ))}
              </div>

              <CatalogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalProducts={totalProducts}
                pageSize={PAGE_SIZE}
                categoria={categoria}
                coleccion={coleccion}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
