import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { describeRules, getAdminCollection } from "@/lib/data/admin-collections";
import { listProducts } from "@/lib/data/products";
import { CollectionFormDialog } from "../collection-form-dialog";
import { CollectionProductsManager, DeleteCollectionButton } from "./collection-manager";

export const metadata: Metadata = { title: "Colección · Admin" };

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getAdminCollection(id);
  if (!collection) notFound();

  const catalog = collection.type === "MANUAL" ? await listProducts() : [];
  const linked = new Set(collection.products.map((p) => p.id));
  const available = catalog
    .filter((p) => !linked.has(p.id))
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const rules = describeRules(collection.rules);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/colecciones"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Colecciones
      </Link>
      <PageHeader
        title={collection.name}
        description={collection.description ?? undefined}
        actions={
          <>
            <a
              href={`/colecciones/${collection.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-2"
            >
              Ver en la tienda
              <ExternalLink className="size-3" />
            </a>
            <CollectionFormDialog
              initial={{
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
                description: collection.description ?? "",
                type: collection.type,
                position: collection.position,
                rules: collection.rules,
              }}
            />
            <DeleteCollectionButton id={collection.id} name={collection.name} />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-normal">
          {collection.type === "AUTO" ? "Automática" : "Manual"}
        </Badge>
        <span className="font-mono">/colecciones/{collection.slug}</span>
        <span>· Orden {collection.position}</span>
      </div>

      {collection.type === "AUTO" ? (
        <section className="rounded-lg border border-border bg-background p-5 space-y-2">
          <h2 className="font-medium">Reglas</h2>
          {rules.length ? (
            <ul className="text-sm font-mono space-y-1">
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin reglas: incluye todo el catálogo activo.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            La tienda muestra hasta 48 productos activos que cumplan todas las reglas, los más
            recientes primero. Edita la colección para cambiarlas.
          </p>
        </section>
      ) : (
        <CollectionProductsManager
          collectionId={collection.id}
          products={collection.products}
          available={available}
        />
      )}
    </div>
  );
}
