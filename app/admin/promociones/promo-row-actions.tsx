"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteDiscountCodeAction,
  setDiscountCodeActiveAction,
} from "@/lib/actions/admin-mutations";

/** Activar/desactivar y borrar un cupón; los errores de la API se muestran en la fila. */
export function PromoRowActions({
  id,
  code,
  active,
}: {
  id: string;
  code: string;
  active: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => ReturnType<typeof deleteDiscountCodeAction>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => setDiscountCodeActiveAction(id, !active))}
        >
          {active ? "Desactivar" : "Activar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label={`Eliminar ${code}`}
          onClick={() => {
            if (window.confirm(`¿Eliminar el código ${code}? No se puede deshacer.`)) {
              run(() => deleteDiscountCodeAction(id));
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      {error && (
        <span role="alert" className="text-[11px] text-destructive max-w-56 text-right">
          {error}
        </span>
      )}
    </div>
  );
}
