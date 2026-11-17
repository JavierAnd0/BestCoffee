"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  saveCollectionAction,
  type CollectionMutationResult,
} from "@/lib/actions/admin-collections";

export interface CollectionFormValues {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: "MANUAL" | "AUTO";
  position: number;
  rules: {
    type?: string;
    roastLevelGte?: number;
    roastLevelLte?: number;
    flavorNote?: string;
    badge?: string;
  } | null;
}

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5";
const FIELD =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

export function CollectionFormDialog({ initial }: { initial?: CollectionFormValues }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"MANUAL" | "AUTO">(initial?.type ?? "MANUAL");
  const [state, dispatch, isPending] = useActionState<CollectionMutationResult | null, FormData>(
    async (prev, formData) => {
      const res = await saveCollectionAction(prev, formData);
      if (res.ok) {
        setOpen(false);
        if (!editing && res.id) router.push(`/admin/colecciones/${res.id}`);
        else router.refresh();
      }
      return res;
    },
    null,
  );
  const r = initial?.rules ?? {};

  return (
    <>
      {editing ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" />
          Editar
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Nueva colección
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              {editing ? "Editar colección" : "Nueva colección"}
            </DialogTitle>
            <DialogDescription>
              Las manuales se arman eligiendo productos; las automáticas se llenan solas con
              los productos activos que cumplan sus reglas.
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-4">
            {initial && <input type="hidden" name="id" value={initial.id} />}
            {state && !state.ok && (
              <div className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800">
                {state.error}
              </div>
            )}

            <label className="block">
              <span className={LABEL}>Nombre</span>
              <input name="name" required maxLength={120} defaultValue={initial?.name} className={FIELD} />
            </label>

            <div className="grid grid-cols-[1fr_96px] gap-3">
              <label className="block">
                <span className={LABEL}>Slug (opcional)</span>
                <input
                  name="slug"
                  maxLength={120}
                  defaultValue={initial?.slug}
                  placeholder="Se genera desde el nombre"
                  className={`${FIELD} font-mono`}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Orden</span>
                <input
                  name="position"
                  type="number"
                  min={0}
                  defaultValue={initial?.position ?? 0}
                  className={`${FIELD} tabular-nums`}
                />
              </label>
            </div>

            <label className="block">
              <span className={LABEL}>Descripción</span>
              <textarea
                name="description"
                maxLength={500}
                rows={2}
                defaultValue={initial?.description}
                className={FIELD}
              />
            </label>

            <label className="block">
              <span className={LABEL}>Tipo</span>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as "MANUAL" | "AUTO")}
                className={FIELD}
              >
                <option value="MANUAL">Manual (eliges los productos)</option>
                <option value="AUTO">Automática (por reglas)</option>
              </select>
            </label>

            {type === "AUTO" && (
              <fieldset className="rounded-md border border-border p-3 space-y-3">
                <legend className="px-1 text-xs text-muted-foreground">
                  Reglas: el producto debe cumplir todas las que completes
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className={LABEL}>Tipo de producto</span>
                    <select name="ruleType" defaultValue={r.type ?? ""} className={FIELD}>
                      <option value="">Cualquiera</option>
                      <option value="SINGLE_ORIGIN">Origen único</option>
                      <option value="BLEND">Mezcla</option>
                      <option value="DECAF">Descafeinado</option>
                      <option value="ACCESSORY">Accesorio</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={LABEL}>Tueste mín.</span>
                    <input
                      name="roastLevelGte"
                      type="number"
                      min={1}
                      max={9}
                      defaultValue={r.roastLevelGte ?? ""}
                      className={`${FIELD} tabular-nums`}
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>Tueste máx.</span>
                    <input
                      name="roastLevelLte"
                      type="number"
                      min={1}
                      max={9}
                      defaultValue={r.roastLevelLte ?? ""}
                      className={`${FIELD} tabular-nums`}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={LABEL}>Nota de sabor</span>
                    <input
                      name="flavorNote"
                      maxLength={80}
                      defaultValue={r.flavorNote ?? ""}
                      placeholder="Exacta, p. ej. Chocolate"
                      className={FIELD}
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>Distintivo</span>
                    <input
                      name="badge"
                      maxLength={80}
                      defaultValue={r.badge ?? ""}
                      placeholder="Exacto, p. ej. BESTSELLER"
                      className={FIELD}
                    />
                  </label>
                </div>
              </fieldset>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear colección"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
