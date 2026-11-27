"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [state, dispatch, isPending] = useActionState<
    AdminMutationResult | null,
    FormData
  >(async (prev, formData) => {
    const res = await createDiscountCodeAction(prev, formData);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
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
              <span className="block admin-label mb-1.5">
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
                <span className="block admin-label mb-1.5">
                  Tipo
                </span>
                <select
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo (COP)</option>
                </select>
              </label>

              <label className="block">
                <span className="block admin-label mb-1.5">
                  {type === "PERCENTAGE" ? "Porcentaje" : "Monto (COP)"}
                </span>
                <input
                  key={type}
                  name="value"
                  type="number"
                  required
                  min={1}
                  max={type === "PERCENTAGE" ? 100 : undefined}
                  defaultValue={type === "PERCENTAGE" ? 15 : 10000}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block admin-label mb-1.5">
                  Límite de usos (opcional)
                </span>
                <input
                  name="maxRedemptions"
                  type="number"
                  min={1}
                  placeholder="Sin límite"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
                />
              </label>

              <label className="block">
                <span className="block admin-label mb-1.5">
                  Vencimiento (opcional)
                </span>
                <input
                  name="endsAt"
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                />
              </label>
            </div>

            <label className="block">
              <span className="block admin-label mb-1.5">
                Compra mínima en COP (opcional)
              </span>
              <input
                name="minSubtotal"
                type="number"
                min={0}
                placeholder="Sin mínimo"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
              />
            </label>

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

