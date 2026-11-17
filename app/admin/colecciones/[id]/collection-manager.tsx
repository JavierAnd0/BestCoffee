"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  attachCollectionProductsAction,
  deleteCollectionAction,
  detachCollectionProductAction,
  reorderCollectionProductsAction,
  type CollectionMutationResult,
} from "@/lib/actions/admin-collections";

type Feedback = { ok: boolean; text: string } | null;

function toFeedback(res: CollectionMutationResult): Feedback {
  return res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error };
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role="status"
      className={
        "rounded-md px-3 py-2 text-xs " +
        (feedback.ok
          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
          : "border border-red-300/60 bg-red-50 text-red-800")
      }
    >
      {feedback.text}
    </p>
  );
}

export function DeleteCollectionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`¿Eliminar la colección "${name}"? Los productos no se borran.`)) return;
          start(async () => {
            const res = await deleteCollectionAction(id);
            if (res.ok) router.push("/admin/colecciones");
            else setError(res.error);
          });
        }}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        Eliminar
      </Button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </>
  );
}

export function CollectionProductsManager({
  collectionId,
  products,
  available,
}: {
  collectionId: string;
  products: Array<{ id: string; name: string; slug: string; status: string }>;
  available: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const run = (fn: () => Promise<CollectionMutationResult>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setFeedback(toFeedback(res));
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });

  const move = (index: number, delta: number) => {
    const ids = products.map((p) => p.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderCollectionProductsAction(collectionId, ids));
  };

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
      <section className="rounded-lg border border-border bg-background">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium">Productos en la colección</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {products.length} {products.length === 1 ? "producto" : "productos"} · la tienda los
            muestra en este orden (solo los activos)
          </p>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            Todavía no hay productos. Añádelos desde el panel de la derecha.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs font-mono text-muted-foreground truncate">{p.slug}</div>
                </div>
                {p.status !== "ACTIVE" && (
                  <Badge variant="outline" className="font-normal text-xs">
                    No visible ({p.status.toLowerCase()})
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Subir ${p.name}`}
                  disabled={pending || i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Bajar ${p.name}`}
                  disabled={pending || i === products.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar ${p.name}`}
                  disabled={pending}
                  onClick={() => run(() => detachCollectionProductAction(collectionId, p.id))}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-background p-5 space-y-3">
        <h2 className="font-medium">Añadir productos</h2>
        <FeedbackLine feedback={feedback} />
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No quedan productos activos del catálogo por añadir.
          </p>
        ) : (
          <>
            <ul className="max-h-80 overflow-y-auto space-y-1 text-sm">
              {available.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id),
                        )
                      }
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              disabled={pending || selected.length === 0}
              onClick={() =>
                run(
                  () => attachCollectionProductsAction(collectionId, selected),
                  () => setSelected([]),
                )
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Añadir {selected.length > 0 ? `(${selected.length})` : ""}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
