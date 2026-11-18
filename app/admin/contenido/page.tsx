import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listContentBlocks, type ContentBlock } from "@/lib/data/admin-content";
import { deleteContentBlockAction, toggleContentBlockAction } from "@/lib/actions/admin-content";
import { LoadError, SectionHeader, fmtDate } from "./_components/fields";
import { ActionButton } from "./_components/row-actions";
import { BLOCK_KINDS, KIND_ORDER, blockState, blockSummary, isContentKind } from "./_components/block-kinds";
import { BlockForm } from "./bloques/block-form";
import { productOptions } from "./bloques/products";
import { EditPanel } from "./_components/edit-panel";

export const metadata: Metadata = { title: "Contenido · Admin" };

/**
 * Lo que de verdad pasa con cada bloque en la tienda. En los tipos de uno solo
 * (portada, destacado, paquete) solo el primer visible por orden se muestra;
 * los demás visibles quedan "en espera".
 */
type Presence = { label: string; hint: string; tone: "live" | "wait" | "off" };

const TONE = {
  live: { dot: "bg-emerald-600", text: "text-emerald-800" },
  wait: { dot: "bg-amber-500", text: "text-amber-800" },
  off: { dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
} as const;

function presenceOf(b: ContentBlock, many: boolean, isFirstVisible: boolean): Presence {
  const state = blockState(b);
  if (state === "Inactivo") return { label: "Oculto", hint: "No se muestra en la tienda.", tone: "off" };
  if (state === "Programado")
    return { label: "Programado", hint: `Aparece desde el ${fmtDate(b.startsAt)}.`, tone: "wait" };
  if (state === "Vencido")
    return { label: "Vencido", hint: `Dejó de mostrarse el ${fmtDate(b.endsAt)}.`, tone: "off" };
  if (many) return { label: "En la tienda", hint: "Se turna con los otros anuncios visibles.", tone: "live" };
  return isFirstVisible
    ? { label: "En la tienda", hint: "Es el que ven tus clientes ahora.", tone: "live" }
    : {
        label: "En espera",
        hint: "No se ve: ya hay otro arriba en la tienda. Aparece si ocultas ese.",
        tone: "wait",
      };
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; nuevo?: string }>;
}) {
  const [res, { editar, nuevo }] = await Promise.all([listContentBlocks(), searchParams]);
  // ?editar=<id> abre ese bloque y ?nuevo=<tipo> uno vacío, en un panel sobre la lista.
  const editing = res.ok ? res.data.find((b) => b.id === editar) : undefined;
  const creating = isContentKind(nuevo) ? nuevo : undefined;
  const openKind = editing?.kind ?? creating;
  const products =
    openKind === "SPOTLIGHT" || openKind === "FEATURED_BUNDLE" ? await productOptions() : [];
  return (
    <div>
      <SectionHeader
        title="Página de inicio"
        description="Cada sección de tu página de inicio sale de un bloque. Haz clic en un bloque para editarlo sin salir de esta página; con Ocultar lo quitas de la tienda sin borrarlo."
      />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : (
        <div className="space-y-6">
          {KIND_ORDER.map((kind) => (
            <KindSection
              key={kind}
              kind={kind}
              blocks={res.data.filter((b) => b.kind === kind)}
            />
          ))}
        </div>
      )}

      {openKind && (
        <EditPanel
          title={editing ? `Editar ${BLOCK_KINDS[openKind].label.toLowerCase()}` : BLOCK_KINDS[openKind].add}
          description={BLOCK_KINDS[openKind].where}
          closeHref="/admin/contenido"
        >
          <BlockForm key={editing?.id ?? `nuevo-${openKind}`} kind={openKind} block={editing} products={products} inline />
        </EditPanel>
      )}
    </div>
  );
}

function KindSection({ kind, blocks }: { kind: ContentBlock["kind"]; blocks: ContentBlock[] }) {
  const info = BLOCK_KINDS[kind];
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const firstVisibleId = sorted.find((b) => blockState(b) === "Visible")?.id;
  const liveCount = sorted.filter((b) => blockState(b) === "Visible").length;

  return (
    <section id={`tipo-${kind}`} className="scroll-mt-6 rounded-lg border border-border bg-background">
      <header className="flex flex-col gap-3 p-5 border-b border-border sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold tracking-tight">{info.label}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground max-w-xl">{info.where}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={
            <Link href={`/admin/contenido?nuevo=${kind}`} scroll={false}>
              <Plus className="size-3.5" />
              {info.add}
            </Link>
          }
        />
      </header>

      {sorted.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted-foreground">
          Esta sección no aparece en tu tienda porque todavía no tiene bloques.
        </p>
      ) : (
        <>
          {liveCount === 0 && (
            <p className="px-5 py-3 text-sm text-amber-800 border-b border-border bg-amber-500/5">
              Ningún bloque está visible, así que esta sección no aparece en tu tienda.
            </p>
          )}
          <ul className="divide-y divide-border">
            {sorted.map((b, i) => {
              const p = presenceOf(b, info.many, b.id === firstVisibleId);
              const tone = TONE[p.tone];
              const editHref = `/admin/contenido?editar=${b.id}`;
              return (
                <li
                  key={b.id}
                  id={`bloque-${b.id}`}
                  className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  {sorted.length > 1 && (
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-[11px] font-medium tabular-nums text-muted-foreground"
                      title="Posición: el número más bajo va primero"
                    >
                      {i + 1}
                    </span>
                  )}
                  <div className="flex-1 min-w-56">
                    {/* El enlace cubre la fila; los botones quedan encima. */}
                    <Link
                      href={editHref}
                      scroll={false}
                      className="text-sm font-medium underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-[var(--accent)]"
                    >
                      {blockSummary(b.kind, b.data) || "Bloque sin texto"}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={"inline-flex items-center gap-1.5 font-medium " + tone.text}>
                        <span className={"size-1.5 rounded-full " + tone.dot} aria-hidden />
                        {p.label}
                      </span>
                      <span className="text-muted-foreground">{p.hint}</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-1">
                    <ActionButton
                      label={b.active ? "Ocultar" : "Mostrar"}
                      variant="ghost"
                      action={toggleContentBlockAction.bind(null, b.id, !b.active)}
                    />
                    <ActionButton
                      label="Borrar"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      confirmText="¿Borrar este bloque? No se puede deshacer. Si solo quieres quitarlo de la tienda, usa Ocultar."
                      action={deleteContentBlockAction.bind(null, b.id)}
                    />
                    <ChevronRight
                      className="ml-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
