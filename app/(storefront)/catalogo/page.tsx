import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/storefront/product-card";
import {
  CatalogFilters,
  type CatalogFacetCounts,
} from "@/components/storefront/catalog-filters";
import { CatalogPagination } from "@/components/storefront/catalog-pagination";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listProducts } from "@/lib/data/products";
import { getCurrentTenant } from "@/lib/data/tenant";
import type { GrindFormat, Product } from "@/lib/types";
import { Coffee, Wrench, Sparkles, ArrowRight, X } from "lucide-react";

function lowestPrice(p: Product): number {
  if (!p.variants.length) return 0;
  return Math.min(...p.variants.map((v) => v.priceOneTimeCents));
}

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
    tipo?: string;
    tueste?: string;
    nota?: string;
    formato?: string;
    disponibilidad?: string;
    orden?: string;
    q?: string;
    pagina?: string;
    page?: string;
  }>;
}) {
  const {
    coleccion,
    categoria,
    tipo,
    tueste,
    nota,
    formato,
    disponibilidad,
    orden,
    q,
    pagina,
    page,
  } = (await searchParams) ?? {};
  const activeCategory = (categoria || coleccion || "todo").toLowerCase();

  const [allProducts, tenant] = await Promise.all([
    listProducts(),
    getCurrentTenant(),
  ]);

  const hasAccessories = tenant.features.accessories !== false;

  // 1. Productos base según pestaña principal (Todo / Café / Accesorios)
  const categoryProducts = allProducts.filter((p) => {
    if (!hasAccessories && p.type === "ACCESSORY") return false;

    if (activeCategory === "accesorios") {
      return p.type === "ACCESSORY" || p.collectionSlugs.includes("accesorios");
    }
    if (activeCategory === "cafe") {
      return p.type !== "ACCESSORY";
    }
    return true;
  });

  // 2. Separar notas sensoriales de café vs. especificaciones de accesorios
  const coffeeNotes = Array.from(
    new Set(
      categoryProducts
        .filter((p) => p.type !== "ACCESSORY")
        .flatMap((p) => p.flavorNotes),
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const accessorySpecs = Array.from(
    new Set(
      categoryProducts
        .filter((p) => p.type === "ACCESSORY")
        .flatMap((p) => p.flavorNotes),
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));

  // 3. Calcular conteos por faceta sobre el subconjunto de la categoría actual
  const counts: CatalogFacetCounts = {
    total: categoryProducts.length,
    byType: {
      SINGLE_ORIGIN: categoryProducts.filter((p) => p.type === "SINGLE_ORIGIN").length,
      BLEND: categoryProducts.filter((p) => p.type === "BLEND").length,
      DECAF: categoryProducts.filter((p) => p.type === "DECAF").length,
      ACCESSORY: categoryProducts.filter((p) => p.type === "ACCESSORY").length,
    },
    byRoast: {
      light: categoryProducts.filter(
        (p) => p.type !== "ACCESSORY" && p.roastLevel >= 1 && p.roastLevel <= 3,
      ).length,
      medium: categoryProducts.filter(
        (p) => p.type !== "ACCESSORY" && p.roastLevel >= 4 && p.roastLevel <= 6,
      ).length,
      dark: categoryProducts.filter(
        (p) => p.type !== "ACCESSORY" && p.roastLevel >= 7 && p.roastLevel <= 9,
      ).length,
    },
    byFormat: {
      WHOLE_BEAN: categoryProducts.filter((p) =>
        p.variants.some((v) => v.grind === "WHOLE_BEAN"),
      ).length,
      ESPRESSO: categoryProducts.filter((p) =>
        p.variants.some((v) => v.grind === "ESPRESSO"),
      ).length,
      FILTER: categoryProducts.filter((p) =>
        p.variants.some((v) => v.grind === "FILTER"),
      ).length,
      FRENCH_PRESS: categoryProducts.filter((p) =>
        p.variants.some((v) => v.grind === "FRENCH_PRESS"),
      ).length,
    },
    byAvailability: {
      bestseller: categoryProducts.filter((p) =>
        p.badges.some((b) => /vendido|bestseller|destacado/i.test(b)),
      ).length,
      limited: categoryProducts.filter((p) =>
        p.badges.some((b) => /limitad|limited|temporada/i.test(b)),
      ).length,
      subscriber: categoryProducts.filter(
        (p) =>
          p.subscriptionAvailability === "SUBSCRIPTION_ONLY" ||
          p.badges.some((b) => /suscriptor/i.test(b)),
      ).length,
    },
  };

  // 4. Aplicar filtros activos seleccionados por el usuario
  const filteredProducts = categoryProducts.filter((p) => {
    if (tipo && p.type !== tipo) return false;

    if (tueste) {
      if (p.type === "ACCESSORY") return false;
      if (tueste === "light" && (p.roastLevel < 1 || p.roastLevel > 3)) return false;
      if (tueste === "medium" && (p.roastLevel < 4 || p.roastLevel > 6)) return false;
      if (tueste === "dark" && (p.roastLevel < 7 || p.roastLevel > 9)) return false;
    }

    if (nota) {
      const target = nota.toLowerCase();
      const hasNote = p.flavorNotes.some((n) => n.toLowerCase() === target);
      if (!hasNote) return false;
    }

    if (formato) {
      const hasGrind = p.variants.some(
        (v) => v.grind === (formato as GrindFormat),
      );
      if (!hasGrind) return false;
    }

    if (disponibilidad) {
      if (
        disponibilidad === "bestseller" &&
        !p.badges.some((b) => /vendido|bestseller|destacado/i.test(b))
      ) {
        return false;
      }
      if (
        disponibilidad === "limited" &&
        !p.badges.some((b) => /limitad|limited|temporada/i.test(b))
      ) {
        return false;
      }
      if (
        disponibilidad === "subscriber" &&
        p.subscriptionAvailability !== "SUBSCRIPTION_ONLY" &&
        !p.badges.some((b) => /suscriptor/i.test(b))
      ) {
        return false;
      }
    }

    if (q) {
      const term = q.toLowerCase().trim();
      const matches =
        p.name.toLowerCase().includes(term) ||
        (p.origin ?? "").toLowerCase().includes(term) ||
        (p.shortDescription ?? "").toLowerCase().includes(term) ||
        p.flavorNotes.some((n) => n.toLowerCase().includes(term));
      if (!matches) return false;
    }

    return true;
  });

  // 5. Ordenar productos
  const sortedProducts = [...filteredProducts];
  if (orden === "precio-asc") {
    sortedProducts.sort((a, b) => lowestPrice(a) - lowestPrice(b));
  } else if (orden === "precio-desc") {
    sortedProducts.sort((a, b) => lowestPrice(b) - lowestPrice(a));
  } else if (orden === "tueste-asc") {
    sortedProducts.sort((a, b) => (a.roastLevel ?? 0) - (b.roastLevel ?? 0));
  }

  const PAGE_SIZE = 9;
  const totalProducts = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const rawPage = parseInt(pagina || page || "1", 10);
  const currentPage = Math.min(
    Math.max(1, isNaN(rawPage) ? 1 : rawPage),
    totalPages,
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalProducts);
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  const isAccessoriesView = activeCategory === "accesorios";
  const isCoffeeView = activeCategory === "cafe";

  const activePills = [
    q ? { label: `Búsqueda: "${q}"`, key: "q" } : null,
    tipo ? { label: `Tipo: ${tipo}`, key: "tipo" } : null,
    tueste ? { label: `Tueste: ${tueste}`, key: "tueste" } : null,
    nota ? { label: `Nota: ${nota}`, key: "nota" } : null,
    formato ? { label: `Formato: ${formato}`, key: "formato" } : null,
    disponibilidad ? { label: `Filtro: ${disponibilidad}`, key: "disponibilidad" } : null,
  ].filter(Boolean) as Array<{ label: string; key: string }>;

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
            className="editorial-nav-link text-xs text-primary font-medium inline-flex items-center gap-1 border border-border"
          >
            <span>Ver vista dedicada de accesorios</span>
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {/* Pestañas de categoría con animación de bloque editorial */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/catalogo"
            data-active={activeCategory === "todo"}
            className="editorial-select-row inline-flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium"
          >
            <Sparkles className="size-3.5" />
            <span>Todos los productos</span>
            <span className="tabular-nums opacity-70 ml-1">
              {String(allProducts.length).padStart(2, "0")}
            </span>
          </Link>

          <Link
            href="/catalogo?categoria=cafe"
            data-active={isCoffeeView}
            className="editorial-select-row inline-flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium"
          >
            <Coffee className="size-3.5" />
            <span>Cafés en grano</span>
            <span className="tabular-nums opacity-70 ml-1">
              {String(
                allProducts.filter((p) => p.type !== "ACCESSORY").length,
              ).padStart(2, "0")}
            </span>
          </Link>

          {hasAccessories && (
            <Link
              href="/catalogo?categoria=accesorios"
              data-active={isAccessoriesView}
              className="editorial-select-row inline-flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium"
            >
              <Wrench className="size-3.5" />
              <span>Accesorios y Equipos</span>
              <span className="tabular-nums opacity-70 ml-1">
                {String(
                  allProducts.filter((p) => p.type === "ACCESSORY").length,
                ).padStart(2, "0")}
              </span>
            </Link>
          )}
        </div>

        {/* Ordenamiento rápido en escritorio */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground mr-1">Ordenar:</span>
          {[
            { key: "", label: "Destacados" },
            { key: "precio-asc", label: "Menor precio" },
            { key: "precio-desc", label: "Mayor precio" },
          ].map((opt) => {
            const isCurrent = (orden ?? "") === opt.key;
            const href = opt.key
              ? `/catalogo?${new URLSearchParams({
                  ...(categoria ? { categoria } : {}),
                  ...(tipo ? { tipo } : {}),
                  ...(tueste ? { tueste } : {}),
                  ...(nota ? { nota } : {}),
                  ...(formato ? { formato } : {}),
                  ...(disponibilidad ? { disponibilidad } : {}),
                  orden: opt.key,
                }).toString()}`
              : `/catalogo${categoria ? `?categoria=${categoria}` : ""}`;
            return (
              <Link
                key={opt.label}
                href={href}
                data-active={isCurrent}
                className="editorial-select-row px-2.5 py-1 border border-border font-medium"
              >
                <span>{opt.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rejilla de productos con filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <CatalogFilters
          coffeeNotes={coffeeNotes}
          accessorySpecs={accessorySpecs}
          counts={counts}
          activeCategory={activeCategory}
        />

        <div>
          {activePills.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {activePills.map((pill) => (
                <Link
                  key={pill.key}
                  href={`/catalogo${categoria ? `?categoria=${categoria}` : ""}`}
                  data-active="true"
                  className="editorial-select-row inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                >
                  <span>{pill.label}</span>
                  <X className="size-3" />
                </Link>
              ))}
            </div>
          )}

          {sortedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No hay productos que coincidan con los criterios seleccionados.
              </p>
              <Link
                href="/catalogo"
                className="mt-4 inline-block text-xs text-primary underline"
              >
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
