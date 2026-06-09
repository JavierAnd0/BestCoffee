import type { Metadata } from "next";
import { Plus, Coffee, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listProducts } from "@/lib/data/products";

export const metadata: Metadata = { title: "Colecciones · Admin" };

interface AdminCollection {
  slug: string;
  name: string;
  type: "MANUAL" | "SMART";
  description: string;
  rule?: string;
  productCount: number;
}

function buildCollections(products: Awaited<ReturnType<typeof listProducts>>): AdminCollection[] {
  return [
  {
    slug: "bestsellers",
    name: "Más vendidos",
    type: "SMART",
    description: "Los cafés que más se llevan los clientes.",
    rule: "Badge: BESTSELLER",
    productCount: products.filter((p) => p.collectionSlugs.includes("bestsellers")).length,
  },
  {
    slug: "mezclas",
    name: "Mezclas",
    type: "SMART",
    description: "Todas las mezclas insignia.",
    rule: "Tipo = MEZCLA",
    productCount: products.filter((p) => p.collectionSlugs.includes("mezclas")).length,
  },
  {
    slug: "origenes",
    name: "Orígenes únicos",
    type: "SMART",
    description: "Lotes con trazabilidad y notas únicas por temporada.",
    rule: "Tipo = ORIGEN_UNICO",
    productCount: products.filter((p) => p.collectionSlugs.includes("origenes")).length,
  },
  {
    slug: "tostados-oscuros",
    name: "Tostados oscuros",
    type: "SMART",
    description: "Para quien busca cuerpo intenso y notas a chocolate negro.",
    rule: "Nivel de tueste ≥ 7",
    productCount: products.filter((p) => p.roastLevel >= 7).length,
  },
  {
    slug: "limitados",
    name: "Ediciones limitadas",
    type: "MANUAL",
    description: "Microlotes y cosechas exclusivas mientras dure el stock.",
    productCount: products.filter((p) => p.collectionSlugs.includes("limitados")).length,
  },
  {
    slug: "descafeinados",
    name: "Descafeinados",
    type: "SMART",
    description: "Sin cafeína, todo el sabor.",
    rule: "Tipo = DESCAF",
    productCount: products.filter((p) => p.collectionSlugs.includes("descafeinados")).length,
  },
];
}

export default async function CollectionsPage() {
  const products = await listProducts();
  const collections = buildCollections(products);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Colecciones"
        description="Agrupa productos manualmente o con reglas automáticas."
        actions={
          <Button>
            <Plus className="size-4" />
            Nueva colección
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((c) => (
          <article
            key={c.slug}
            className="rounded-lg border border-border bg-background p-5 hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="font-normal">
                {c.type === "SMART" ? (
                  <>
                    <Filter className="size-3" />
                    Smart
                  </>
                ) : (
                  "Manual"
                )}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Coffee className="size-3" />
                {c.productCount}
              </span>
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold tracking-tight">
              {c.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {c.description}
            </p>
            {c.rule && (
              <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Regla
                <div className="font-mono text-foreground/90 mt-1 normal-case tracking-normal">
                  {c.rule}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
