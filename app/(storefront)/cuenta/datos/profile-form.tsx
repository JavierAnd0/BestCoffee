"use client";

import { useActionState, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateCustomerProfileAction,
  deleteCustomerAccountAction,
  type ProfileActionState,
} from "@/lib/actions/customer-account";
import type { MockCustomer } from "@/lib/mocks/account";

export function ProfileForm({ customer }: { customer: MockCustomer }) {
  const [state, dispatch, isPending] = useActionState<ProfileActionState, FormData>(
    updateCustomerProfileAction,
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteCustomerAccountAction();
  };

  return (
    <div className="space-y-8">
      <form action={dispatch} className="space-y-4">
        {state?.error && (
          <div className="rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Nombre completo
          </span>
          <input
            name="name"
            type="text"
            required
            defaultValue={customer.name}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Email
          </span>
          <input
            name="email"
            type="email"
            defaultValue={customer.email}
            readOnly
            className="w-full rounded-md border border-input bg-muted/40 text-muted-foreground px-3 py-2 text-sm outline-none cursor-not-allowed"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Teléfono
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={customer.phone}
            placeholder="+57 300 000 0000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
          />
        </label>

        <section className="pt-4 border-t border-border">
          <h2 className="font-display text-xl font-semibold mb-3">
            Preferencias de correo
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { id: "pref_reminders", label: "Recordatorios de próximo envío" },
              { id: "pref_releases", label: "Novedades y nuevos lanzamientos" },
              { id: "pref_promos", label: "Promociones y descuentos" },
              { id: "pref_blog", label: "Boletín del blog" },
            ].map((p, i) => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={p.id}
                  defaultChecked={i < 2}
                  className="size-4 accent-foreground"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-xl font-semibold mb-3 text-destructive">
          Zona delicada
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Eliminar tu cuenta cancela todas tus suscripciones activas. Esta acción no se
          puede deshacer.
        </p>
        {!confirmDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar mi cuenta
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Eliminando…" : "Confirmar eliminación definitiva"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

