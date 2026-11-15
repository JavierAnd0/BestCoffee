import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  pageSize: number;
  categoria?: string;
  coleccion?: string;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  totalProducts,
  pageSize,
  categoria,
  coleccion,
}: CatalogPaginationProps) {
  if (totalProducts === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (coleccion) params.set("coleccion", coleccion);
    if (pageNumber > 1) params.set("pagina", pageNumber.toString());
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  };

  // Generar páginas con elipsis
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-16 flex flex-col items-center gap-4">
      {totalPages > 1 && (
        <nav
          role="navigation"
          aria-label="Paginación de productos"
          className="flex items-center gap-1.5"
        >
          {/* Botón Anterior */}
          {currentPage > 1 ? (
            <Link
              href={getPageUrl(currentPage - 1)}
              aria-label="Ir a la página anterior"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium border border-border/50 bg-background text-muted-foreground/40 pointer-events-none select-none"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </span>
          )}

          {/* Números de página */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="size-9 inline-flex items-center justify-center text-muted-foreground select-none"
                    aria-hidden="true"
                  >
                    <MoreHorizontal className="size-4" />
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              if (isCurrent) {
                return (
                  <span
                    key={p}
                    aria-current="page"
                    className="size-9 inline-flex items-center justify-center rounded-lg text-xs font-semibold bg-foreground text-background shadow-xs select-none"
                  >
                    {p}
                  </span>
                );
              }

              return (
                <Link
                  key={p}
                  href={getPageUrl(p)}
                  aria-label={`Ir a la página ${p}`}
                  className="size-9 inline-flex items-center justify-center rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {p}
                </Link>
              );
            })}
          </div>

          {/* Botón Siguiente */}
          {currentPage < totalPages ? (
            <Link
              href={getPageUrl(currentPage + 1)}
              aria-label="Ir a la página siguiente"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-3.5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-medium border border-border/50 bg-background text-muted-foreground/40 pointer-events-none select-none"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-3.5" />
            </span>
          )}
        </nav>
      )}

      {/* Resumen de conteo */}
      <span className="text-xs text-muted-foreground">
        Mostrando {startItem}–{endItem} de {totalProducts}{" "}
        {totalProducts === 1 ? "producto" : "productos"}
        {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
      </span>
    </div>
  );
}
