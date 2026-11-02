"use client";

import { useActionState, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
  createDiscountCodeAction,
  type AdminMutationResult,
} from "@/lib/actions/admin-mutations";

export function PromoCreateDialog() {
  const [open, setOpen] = useState(false);
  const [state, dispatch, isPending] = useActionState<
    AdminMutationResult | null,
    FormData
  >(async (prev, formData) => {
    const res = await createDiscountCodeAction(prev, formData);
    if (res.ok) setOpen(false);
    return res;
  }, null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-1" />
        Nuevo código
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              Nuevo código promocional
            </DialogTitle>
            <DialogDescription>
              Crea un cupón de descuento para el checkout de tu tienda.
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-4">
            {state && !state.ok && (
              <div className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800">
                {state.error}
              </div>
            )}

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                Código
              </span>
              <input
                name="code"
                required
                placeholder="BIENVENIDO15"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase outline-none focus-visible:border-foreground/40"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                  Tipo
                </span>
                <select
                  name="type"
                  defaultValue="PERCENT"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                >
                  <option value="PERCENT">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo (COP)</option>
                  <option value="FREE_SHIPPING">Envío gratis</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                  Valor
                </span>
                <input
                  name="value"
                  type="number"
                  min={0}
                  defaultValue={15}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                  Límite de usos (opcional)
                </span>
                <input
                  name="usesLimit"
                  type="number"
                  min={1}
                  placeholder="Sin límite"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                  Vencimiento (opcional)
                </span>
                <input
                  name="expiresAt"
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                />
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Crear código
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

