"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, ChevronDown, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  type MemberActionResult,
} from "@/lib/actions/members";
import type { MemberRole, TeamMember } from "@/lib/data/members";

/** De menos a más acceso: así se lee qué suma cada rol. */
const ROLES: {
  value: MemberRole;
  label: string;
  summary: string;
  areas: string[];
}[] = [
  {
    value: "TENANT_ORDERS",
    label: "Pedidos",
    summary: "Atiende la operación diaria: pedidos, despachos y suscripciones.",
    areas: ["Pedidos", "Suscripciones y regalos", "Logística", "Clientes"],
  },
  {
    value: "TENANT_EDITOR",
    label: "Editor",
    summary: "Mantiene el catálogo y el contenido de la tienda al día.",
    areas: ["Productos y colecciones", "Contenido, blog, guías y sedes", "Promociones y reseñas", "Clientes"],
  },
  {
    value: "TENANT_OWNER",
    label: "Dueño",
    summary: "Maneja toda la tienda, incluido quién entra al panel.",
    areas: ["Todo lo de Pedidos y Editor", "Equipo", "Configuración, plan y pagos", "Auditoría"],
  },
];

const roleOf = (role: string) => ROLES.find((r) => r.value === role);
const roleLabel = (role: string) => roleOf(role)?.label ?? role;

const sameEmail = (a: string, b: string | null) => !!b && a.toLowerCase() === b.toLowerCase();

function displayName(m: { name: string | null; email: string }) {
  return m.name?.trim() || m.email.split("@")[0];
}

function initials(m: { name: string | null; email: string }) {
  const parts = displayName(m).split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function accessLink(email: string) {
  return `${window.location.origin}/acceso?email=${encodeURIComponent(email)}`;
}

function copyAccessLink(m: { name: string | null; email: string }) {
  navigator.clipboard
    ?.writeText(accessLink(m.email))
    .then(() =>
      toast({
        title: "Enlace copiado",
        description: `Compártelo con ${displayName(m)}: entra con su correo, sin contraseña.`,
      }),
    )
    .catch(() => toast({ title: "No pudimos copiar el enlace", description: accessLink(m.email) }));
}

/** Tarjetas para elegir rol: cada una dice qué puede hacer, no solo su nombre. */
function RoleCards({
  value,
  onChange,
  name,
}: {
  value: MemberRole;
  onChange: (v: MemberRole) => void;
  name?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Rol" className="grid gap-2">
      {ROLES.map((r) => {
        const active = r.value === value;
        return (
          <label
            key={r.value}
            className={
              "flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition-colors " +
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/30 " +
              (active
                ? "border-foreground bg-foreground/[0.03]"
                : "border-border hover:border-foreground/40")
            }
          >
            <input
              type="radio"
              name={name ?? "role-choice"}
              value={r.value}
              checked={active}
              onChange={() => onChange(r.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border " +
                (active ? "border-foreground bg-foreground text-background" : "border-foreground/30")
              }
            >
              {active && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{r.summary}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Qué puede hacer cada rol y quién lo tiene hoy. */
export function RoleGuide({ members }: { members: TeamMember[] }) {
  return (
    <section aria-labelledby="roles-title" className="space-y-3">
      <h2 id="roles-title" className="font-display text-lg font-semibold">
        Qué puede hacer cada rol
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => {
          const count = members.filter((m) => m.role === r.value).length;
          return (
            <div key={r.value} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{r.label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count === 0 ? "Nadie" : `${count} ${count === 1 ? "persona" : "personas"}`}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {r.areas.map((a) => (
                  <li key={a} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Cómo llega alguien nuevo al panel: no hay invitación por correo. */
export function AccessSteps() {
  const steps = [
    "Agrégala aquí con su correo y el rol que necesita.",
    "Copia su enlace de acceso y envíaselo por donde prefieras.",
    "Entra con su correo y recibe un enlace de un solo uso. No necesita contraseña.",
  ];
  return (
    <section aria-labelledby="access-title" className="rounded-lg border border-border bg-background p-4 sm:p-5">
      <h2 id="access-title" className="text-sm font-semibold">
        Cómo entra alguien nuevo
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium tabular-nums"
            >
              {i + 1}
            </span>
            <span className="text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  // Por defecto el rol con menos acceso: subir de rol es una decisión explícita.
  const [role, setRole] = useState<MemberRole>("TENANT_ORDERS");
  const [added, setAdded] = useState<{ email: string; name: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, dispatch, isPending] = useActionState<MemberActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await addMemberAction(prev, formData);
      if (res.ok) {
        const name = String(formData.get("name") ?? "").trim();
        setAdded({ email: res.email ?? String(formData.get("email") ?? ""), name: name || null });
      }
      return res;
    },
    null,
  );

  function openDialog() {
    setAdded(null);
    setCopied(false);
    setRole("TENANT_ORDERS");
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Plus className="size-4 mr-1" />
        Agregar persona
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          {added ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-semibold">
                  {displayName(added)} ya está en el equipo
                </DialogTitle>
                <DialogDescription>
                  No le llega ningún correo nuestro. Envíale este enlace: entra con {added.email} y
                  recibe un enlace de un solo uso para iniciar sesión.
                </DialogDescription>
              </DialogHeader>
              <input
                readOnly
                value={accessLink(added.email)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Enlace de acceso"
                className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
              />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Listo
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(accessLink(added.email))
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false));
                  }}
                >
                  {copied ? <Check className="size-4 mr-1" /> : <Link2 className="size-4 mr-1" />}
                  {copied ? "Enlace copiado" : "Copiar enlace"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-semibold">Agregar persona</DialogTitle>
                <DialogDescription>
                  Entrará al panel con su correo, sin contraseña. Después te damos el enlace para
                  compartírselo.
                </DialogDescription>
              </DialogHeader>
              <form action={dispatch} className="space-y-4">
                {state && !state.ok && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    {state.error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="admin-label mb-1.5">Correo</span>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="persona@correo.com"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                    />
                  </label>
                  <label className="block">
                    <span className="admin-label mb-1.5">Nombre (opcional)</span>
                    <input
                      name="name"
                      maxLength={120}
                      autoComplete="off"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="admin-label mb-1.5">Qué podrá hacer</legend>
                  <input type="hidden" name="role" value={role} />
                  <RoleCards value={role} onChange={setRole} />
                </fieldset>

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
                    Agregar persona
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatSince(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "hoy", "ayer", "hace 5 días" o la fecha, según qué tan reciente sea. */
function formatLastLogin(iso: string) {
  const day = 86_400_000;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(new Date(iso))) / day);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return `el ${new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Si ya entró al panel. `undefined`: el backend aún no lo informa. */
function AccessStatus({ member, since }: { member: TeamMember; since: string | null }) {
  if (member.lastLoginAt === undefined) {
    return since ? <p className="text-xs text-muted-foreground">En el equipo desde {since}</p> : null;
  }
  if (member.lastLoginAt === null) {
    return (
      <>
        <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber-500" />
          <span className="font-medium text-amber-800">Aún no entra</span>
        </p>
        {since && <p className="text-xs text-muted-foreground">En el equipo desde {since}</p>}
      </>
    );
  }
  return (
    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground" suppressHydrationWarning>
      <span aria-hidden className="size-1.5 rounded-full bg-emerald-600" />
      Entró por última vez {formatLastLogin(member.lastLoginAt)}
    </p>
  );
}

export function TeamList({
  members,
  currentEmail,
}: {
  members: TeamMember[];
  currentEmail: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [editing, setEditing] = useState<{ member: TeamMember; role: MemberRole } | null>(null);
  const [, startTransition] = useTransition();

  const ownerCount = members.filter((m) => m.role === "TENANT_OWNER").length;

  function run(userId: string, task: () => Promise<MemberActionResult>) {
    setError(null);
    setBusyId(userId);
    startTransition(async () => {
      const res = await task();
      if (!res.ok) setError(res.error);
      setBusyId(null);
    });
  }

  const editingSelf = editing ? sameEmail(editing.member.email, currentEmail) : false;
  const removingSelf = toRemove ? sameEmail(toRemove.email, currentEmail) : false;

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

      <ul className="divide-y divide-border rounded-lg border border-border bg-background">
        {members.map((m) => {
          const isSelf = sameEmail(m.email, currentEmail);
          // El backend no deja sin dueño a la tienda; aquí ni se ofrece.
          const lastOwner = m.role === "TENANT_OWNER" && ownerCount <= 1;
          const busy = busyId === m.userId;
          const since = formatSince(m.createdAt);
          return (
            <li
              key={m.userId}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium"
                >
                  {initials(m)}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                    <span className="truncate">{displayName(m)}</span>
                    {isSelf && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                  <AccessStatus member={m} since={since} />
                </div>
              </div>

              <div className="flex items-center gap-2 pl-[3.25rem] sm:pl-0">
                {lastOwner ? (
                  <span
                    className="inline-flex h-9 items-center rounded-full border border-border px-3 text-sm"
                    title="Es el único dueño: la tienda necesita al menos uno."
                  >
                    {roleLabel(m.role)}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditing({ member: m, role: m.role })}
                    aria-label={`Rol de ${displayName(m)}: ${roleLabel(m.role)}. Cambiar rol`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm transition-colors hover:border-foreground/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-60"
                  >
                    {roleLabel(m.role)}
                    <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
                  </button>
                )}

                <div className="ml-auto flex items-center gap-1 sm:ml-2">
                  {busy ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {!isSelf && (
                        <Button
                          // Quien aún no entra es quien más necesita el enlace.
                          variant={m.lastLoginAt === null ? "outline" : "ghost"}
                          size="sm"
                          onClick={() => copyAccessLink(m)}
                          aria-label={`Copiar enlace de acceso de ${displayName(m)}`}
                        >
                          <Link2 className="size-4" />
                          <span className="hidden md:inline">Enlace de acceso</span>
                        </Button>
                      )}
                      {!lastOwner && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar a ${displayName(m)} del equipo`}
                          onClick={() => setToRemove(m)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              Rol de {editing && displayName(editing.member)}
            </DialogTitle>
            <DialogDescription>
              {editingSelf
                ? "Es tu propio acceso. Si dejas de ser dueño, ya no verás Equipo, Configuración ni Auditoría."
                : "Cambia lo que puede ver y hacer en el panel."}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <RoleCards
              value={editing.role}
              onChange={(role) => setEditing({ ...editing, role })}
            />
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!editing || editing.role === editing.member.role}
              onClick={() => {
                const target = editing;
                setEditing(null);
                if (target) {
                  run(target.member.userId, () =>
                    updateMemberRoleAction(target.member.userId, target.role),
                  );
                }
              }}
            >
              {editing && editing.role !== editing.member.role
                ? `Cambiar a ${roleLabel(editing.role)}`
                : "Cambiar rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toRemove !== null} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              ¿Quitar a {toRemove && displayName(toRemove)} del equipo?
            </DialogTitle>
            <DialogDescription>
              {removingSelf
                ? "Es tu propio acceso: saldrás del panel de esta tienda y otro dueño tendrá que volver a agregarte."
                : `${toRemove?.email} dejará de poder entrar al panel. Puedes agregar ese correo de nuevo cuando quieras.`}
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
              Quitar del equipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
