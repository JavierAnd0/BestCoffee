import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, Filter, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { describeRules, listAdminCollections } from "@/lib/data/admin-collections";
import { CollectionFormDialog } from "./collection-form-dialog";

export const metadata: Metadata = { title: "Colecciones · Admin" };

export default async function CollectionsPage() {
  const result = await listAdminCollections();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colecciones"
        description="Agrupa productos manualmente o con reglas automáticas. Se publican en la tienda en /colecciones."
        actions={<CollectionFormDialog />}
      />

      {!result.ok ? (
        <div className="rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar las colecciones: {result.error}
        </div>
      ) : result.collections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="size-5" />}
          title="Aún no hay colecciones"
          description="Crea la primera para agrupar productos (por ejemplo, “Para espresso” o “Tostados oscuros”)."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.collections.map((c) => {
            const rules = describeRules(c.rules);
            return (
              <Link
                key={c.id}
                href={`/admin/colecciones/${c.id}`}
                className="block rounded-lg border border-border bg-background p-5 hover:border-foreground/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-normal">
                    {c.type === "AUTO" ? (
                      <>
                        <Filter className="size-3" />
                        Automática
                      </>
                    ) : (
                      "Manual"
                    )}
                  </Badge>
                  {c.type === "MANUAL" && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Coffee className="size-3" />
                      {c.linkedCount}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold tracking-tight">{c.name}</h2>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">/colecciones/{c.slug}</p>
                {c.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                {c.type === "AUTO" && (
                  <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Reglas
                    <div className="font-mono text-foreground/90 mt-1 normal-case tracking-normal">
                      {rules.length ? rules.join(" · ") : "Sin reglas: incluye todo el catálogo activo"}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
