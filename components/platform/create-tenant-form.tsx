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

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTenantAction({
        slug,
        name,
        tier,
        ownerEmail,
        ownerName: ownerName || undefined,
        domain: domain || undefined,
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
