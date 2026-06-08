import { ProductCard } from "@/components/storefront/product-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS } from "@/lib/mocks/products";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo" };

const TYPE_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "BLEND", label: "Mezcla" },
  { value: "SINGLE_ORIGIN", label: "Origen único" },
  { value: "DECAF", label: "Descafeinado" },
];

export default function CatalogoPage() {
  const products = PRODUCTS;
  // Aggregate flavor notes available across the catalog for the filter facet.
  const allNotes = Array.from(
    new Set(products.flatMap((p) => p.flavorNotes)),
  ).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-xs text-muted-foreground mb-2">Inicio / Catálogo</nav>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <Eyebrow>Todo el café</Eyebrow>
          <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            Catálogo
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{products.length} productos</span>
          <button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:border-foreground/30 transition-colors">
            Ordenar: Destacados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <aside className="space-y-8">
          <FacetGroup title="Tipo de café">
            <div className="space-y-2">
              {TYPE_FILTERS.map((f) => (
                <label key={f.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="size-4 accent-foreground" />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </FacetGroup>

          <FacetGroup title="Nivel de tostado">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Claro</span>
              <div className="flex flex-1 items-center gap-[3px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-2 flex-1 rounded-[1px] border border-foreground/20 " +
                      (i >= 2 && i <= 6 ? "bg-foreground/70" : "")
                    }
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">Oscuro</span>
            </div>
          </FacetGroup>

          <FacetGroup title="Notas de sabor">
            <div className="flex flex-wrap gap-1.5">
              {allNotes.map((n, i) => (
                <Badge
                  key={n}
                  variant={i < 2 ? "secondary" : "outline"}
                  className="font-normal cursor-pointer hover:bg-muted"
                >
                  {n}
                </Badge>
              ))}
            </div>
          </FacetGroup>

          <FacetGroup title="Formato">
            <div className="space-y-2">
              {["Grano entero", "Molido espresso", "Molido filtro", "Molido prensa"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="size-4 accent-foreground" />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </FacetGroup>

          <FacetGroup title="Disponibilidad">
            <div className="space-y-2">
              {["Exclusivo suscriptores", "Edición limitada", "Más vendidos"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="size-4 accent-foreground" />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </FacetGroup>
        </aside>

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

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}
