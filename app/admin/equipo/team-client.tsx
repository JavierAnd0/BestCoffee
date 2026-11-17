"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  type MemberActionResult,
} from "@/lib/actions/members";
import type { MemberRole, TeamMember } from "@/lib/data/members";

const ROLE_OPTIONS: { value: MemberRole; label: string; hint: string }[] = [
  {
    value: "TENANT_OWNER",
    label: "Dueño",
    hint: "Todo el panel, incluidos el equipo, la configuración, el plan, los pagos y la auditoría.",
  },
  {
    value: "TENANT_EDITOR",
    label: "Editor",
    hint: "Catálogo, colecciones, contenido, blog, guías, sedes, promociones, reseñas y clientes.",
  },
  {
    value: "TENANT_ORDERS",
    label: "Pedidos",
    hint: "Pedidos, suscripciones, regalos y clientes.",
  },
];

const roleLabel = (role: string) => ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

/** Qué puede hacer cada rol, en una línea. */
export function RoleGuide() {
  return (
    <dl className="rounded-lg border border-border bg-background p-4 text-sm space-y-2">
      {ROLE_OPTIONS.map((r) => (
        <div key={r.value} className="sm:flex sm:gap-3">
          <dt className="font-medium sm:w-20 shrink-0">{r.label}</dt>
          <dd className="text-muted-foreground">{r.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

function accessLink(email: string) {
  return `${window.location.origin}/acceso?email=${encodeURIComponent(email)}`;
}

const FIELD_LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5";
const FIELD_INPUT =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MemberRole>("TENANT_EDITOR");
  const [added, setAdded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, dispatch, isPending] = useActionState<MemberActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await addMemberAction(prev, formData);
      if (res.ok) setAdded(res.email ?? String(formData.get("email") ?? ""));
      return res;
    },
    null,
  );

  function openDialog() {
    setAdded(null);
    setCopied(false);
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Plus className="size-4 mr-1" />
        Agregar persona
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              Agregar persona
            </DialogTitle>
            <DialogDescription>
              Podrá entrar al panel con este correo, sin contraseña.
            </DialogDescription>
          </DialogHeader>

          {added ? (
            <div className="space-y-4">
              <p className="text-sm">
                <span className="font-medium">{added}</span> ya está en el equipo. Compártele
                este enlace: entra con su correo y recibe un enlace de acceso de un solo uso.
              </p>
              <input
                readOnly
                value={accessLink(added)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Enlace de acceso"
                className={FIELD_INPUT}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(accessLink(added))
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false));
                  }}
                >
                  {copied ? "Copiado" : "Copiar enlace"}
                </Button>
                <Button type="button" onClick={() => setOpen(false)}>
                  Listo
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={dispatch} className="space-y-4">
              {state && !state.ok && (
                <div
                  role="alert"
                  className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  {state.error}
                </div>
              )}
  
              <label className="block">
                <span className={FIELD_LABEL}>Correo</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="persona@correo.com"
                  className={FIELD_INPUT}
                />
              </label>
  
              <label className="block">
                <span className={FIELD_LABEL}>Nombre (opcional)</span>
                <input name="name" maxLength={120} autoComplete="off" className={FIELD_INPUT} />
              </label>
  
              <label className="block">
                <span className={FIELD_LABEL}>Rol</span>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className={FIELD_INPUT}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  {ROLE_OPTIONS.find((r) => r.value === role)?.hint}
                </span>
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
                  Agregar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TeamTable({
  members,
  currentEmail,
}: {
  members: TeamMember[];
  currentEmail: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [roleChange, setRoleChange] = useState<{ member: TeamMember; role: string } | null>(null);
  const [, startTransition] = useTransition();

  function run(userId: string, task: () => Promise<MemberActionResult>) {
    setError(null);
    setBusyId(userId);
    startTransition(async () => {
      const res = await task();
      if (!res.ok) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Persona</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => {
              const isSelf = !!currentEmail && m.email.toLowerCase() === currentEmail.toLowerCase();
              const busy = busyId === m.userId;
              return (
                <tr key={m.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {m.name?.trim() || m.email.split("@")[0]}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Rol de ${m.email}`}
                      // Sin estado propio: tras guardar, la lista se recarga con
                      // el rol real; si el backend lo rechaza, vuelve al anterior.
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => setRoleChange({ member: m, role: e.target.value })}
                      className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-foreground/40 disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {busy ? (
                      <Loader2 className="inline size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar a ${m.email}`}
                        onClick={() => setToRemove(m)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={roleChange !== null} onOpenChange={(o) => !o && setRoleChange(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">Cambiar rol</DialogTitle>
            <DialogDescription>
              {roleChange &&
                `${roleChange.member.email} pasará de ${roleLabel(roleChange.member.role)} a ${roleLabel(roleChange.role)}.`}
              {roleChange &&
                !!currentEmail &&
                roleChange.member.email.toLowerCase() === currentEmail.toLowerCase() &&
                roleChange.role !== "TENANT_OWNER" &&
                " Es tu propio acceso: dejarás de ver Equipo, Configuración y Auditoría."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {roleChange && ROLE_OPTIONS.find((r) => r.value === roleChange.role)?.hint}
          </p>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setRoleChange(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const target = roleChange;
                setRoleChange(null);
                if (target) {
                  run(target.member.userId, () =>
                    updateMemberRoleAction(target.member.userId, target.role),
                  );
                }
              }}
            >
              Cambiar rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toRemove !== null} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              Quitar del equipo
            </DialogTitle>
            <DialogDescription>
              {toRemove?.email} dejará de tener acceso al panel de esta tienda.
              {toRemove &&
                !!currentEmail &&
                toRemove.email.toLowerCase() === currentEmail.toLowerCase() &&
                " Es tu propio acceso: saldrás del panel de esta tienda."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setToRemove(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const target = toRemove;
                setToRemove(null);
                if (target) run(target.userId, () => removeMemberAction(target.userId));
              }}
            >
              Quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
