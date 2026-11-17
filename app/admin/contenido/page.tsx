import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listContentBlocks, type ContentBlock } from "@/lib/data/admin-content";
import { deleteContentBlockAction, toggleContentBlockAction } from "@/lib/actions/admin-content";
import { LoadError, SectionHeader, fmtDate } from "./_components/fields";
import { ActionButton } from "./_components/row-actions";
import { BLOCK_KINDS, KIND_ORDER, blockState, blockSummary } from "./_components/block-kinds";

export const metadata: Metadata = { title: "Contenido · Admin" };

const STATE_CLASS = {
  Visible: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Programado: "bg-amber-500/10 text-amber-800 border-amber-500/20",
  Vencido: "bg-muted text-muted-foreground border-border",
  Inactivo: "bg-muted text-muted-foreground border-border",
} as const;

export default async function AdminContentPage() {
  const res = await listContentBlocks();
  return (
    <div>
      <SectionHeader
        title="Inicio"
        description="Bloques de la página de inicio y la barra de anuncios. Si un tipo no tiene ningún bloque visible, esa sección no aparece en la tienda."
      />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : (
        <div className="space-y-6">
          {KIND_ORDER.map((kind) => (
            <KindSection key={kind} kind={kind} blocks={res.data.filter((b) => b.kind === kind)} />
          ))}
        </div>
      )}
    </div>
  );
}

function KindSection({ kind, blocks }: { kind: ContentBlock["kind"]; blocks: ContentBlock[] }) {
  const info = BLOCK_KINDS[kind];
  return (
    <section className="rounded-lg border border-border bg-background">
      <header className="flex flex-wrap items-start justify-between gap-3 p-5 border-b border-border">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{info.label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{info.where}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/admin/contenido/bloques/nuevo?tipo=${kind}`}><Plus className="size-3.5" />Agregar</Link>}
        />
      </header>
      {blocks.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">Sin bloques: la sección no se muestra.</p>
      ) : (
        <ul className="divide-y divide-border">
          {blocks.map((b) => {
            const state = blockState(b);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-48">
                  <Link href={`/admin/contenido/bloques/${b.id}`} className="text-sm font-medium hover:underline underline-offset-2">
                    {blockSummary(b.kind, b.data) || "(sin texto)"}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Orden {b.position}
                    {(b.startsAt || b.endsAt) && ` · ${fmtDate(b.startsAt)} – ${fmtDate(b.endsAt)}`}
                  </div>
                </div>
                <Badge variant="outline" className={STATE_CLASS[state]}>{state}</Badge>
                <ActionButton
                  label={b.active ? "Desactivar" : "Activar"}
                  action={toggleContentBlockAction.bind(null, b.id, !b.active)}
                />
                <ActionButton
                  label="Borrar"
                  variant="destructive"
                  confirmText="¿Borrar este bloque? No se puede deshacer."
                  action={deleteContentBlockAction.bind(null, b.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
