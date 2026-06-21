"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTenantAction } from "@/lib/actions/platform";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateTenantForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [tier, setTier] = useState("STARTER");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [domain, setDomain] = useState("");
  const [commissionEnabled, setCommissionEnabled] = useState(false);
  const [commissionPct, setCommissionPct] = useState("");

  // La comisión solo puede habilitarse en PRO/BUSINESS.
  const commissionAllowed = tier !== "STARTER";

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pct = commissionPct.trim() === "" ? undefined : parseFloat(commissionPct);
    startTransition(async () => {
      const result = await createTenantAction({
        slug,
        name,
        tier,
        ownerEmail,
        ownerName: ownerName || undefined,
        domain: domain || undefined,
        commissionEnabled: commissionAllowed && commissionEnabled,
        ...(commissionAllowed && commissionEnabled && pct != null
          ? { commissionPct: pct }
          : {}),
      });
      if (result.ok) {
        router.push(`/platform/superadmin/tenants/${result.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Información de la tienda
        </h2>

        <Field label="Nombre de la cafetería" required>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Café Roma"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Slug (URL)" required hint="Solo letras minúsculas, números y guiones">
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            placeholder="cafe-roma"
            pattern="^[a-z0-9-]+$"
            required
            className={inputClass}
          />
          {slug && (
            <p className="text-xs text-muted-foreground mt-1">
              tienda en: <span className="font-mono">{slug}.bestcoffee.io</span>
            </p>
          )}
        </Field>

        <Field label="Plan">
          <select value={tier} onChange={(e) => setTier(e.target.value)} className={inputClass}>
            <option value="STARTER">STARTER</option>
            <option value="PRO">PRO</option>
            <option value="BUSINESS">BUSINESS</option>
          </select>
        </Field>

        <Field label="Dominio personalizado" hint="Opcional, sin https://">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="tienda.caferoma.com"
            className={inputClass}
          />
        </Field>

        {/* Comisión por ventas — SOLO puede habilitarse aquí, al crear. */}
        <div className="rounded-md border border-border p-3 space-y-3">
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <span>
              <span className="block text-sm font-medium">
                Habilitar cobro por comisión
              </span>
              <span className="block text-xs text-muted-foreground">
                Permite cobrar un % sobre ventas. Solo se puede activar al crear el
                tenant y requiere plan PRO o BUSINESS. Después podrá cambiar a otra
                modalidad, pero esta opción no se podrá habilitar más tarde.
              </span>
            </span>
            <input
              type="checkbox"
              checked={commissionAllowed && commissionEnabled}
              disabled={!commissionAllowed}
              onChange={(e) => setCommissionEnabled(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-foreground disabled:opacity-40"
            />
          </label>

          {!commissionAllowed && (
            <p className="text-xs text-muted-foreground">
              Selecciona plan PRO o BUSINESS para habilitar esta opción.
            </p>
          )}

          {commissionAllowed && commissionEnabled && (
            <Field label="% de comisión inicial" hint="Opcional, lo puedes definir luego">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                placeholder="8"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Primer administrador (TENANT_OWNER)
        </h2>

        <Field label="Email" required>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@caferoma.com"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Nombre" hint="Opcional">
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="María García"
            className={inputClass}
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando…" : "Crear tenant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 transition-colors";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="font-normal text-muted-foreground ml-1.5">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
