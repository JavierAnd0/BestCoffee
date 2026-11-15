"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTenantAction } from "@/lib/actions/platform";
import { mapBranding } from "@/lib/api/mappers";
import type { EditorialPage } from "@/lib/types";

const PAGES: { key: EditorialPage; label: string; help: string }[] = [
  { key: "historia", label: "Nuestra historia", help: "/historia" },
  { key: "impacto", label: "Impacto", help: "/impacto" },
  { key: "sostenibilidad", label: "Sostenibilidad", help: "/sostenibilidad" },
  { key: "mayoristas", label: "Mayoristas", help: "/mayoristas" },
  { key: "tiendas", label: "Sedes físicas", help: "/tiendas" },
];

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50";

/**
 * Identidad de la tienda (se guarda en `Tenant.branding`). El storefront la usa
 * para el logo, el color de acento, los datos de contacto, la factura y los
 * textos legales. Un campo vacío se omite en la tienda: nunca se rellena con
 * los datos de otra marca.
 */
export function TenantBrandingForm({
  tenantId,
  slug,
  tagline: initialTagline,
  branding,
}: {
  tenantId: string;
  slug: string;
  tagline: string;
  /** JSON guardado en el tenant. */
  branding: Record<string, unknown>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mismos valores efectivos que verá la tienda (incluye los predeterminados).
  const initial = mapBranding(slug, branding);
  const [form, setForm] = useState({
    tagline: initialTagline,
    accent: initial.accent ?? "",
    logoUrl: initial.logoUrl ?? "",
    contactEmail: initial.contactEmail ?? "",
    contactPhone: initial.contactPhone ?? "",
    legalName: initial.legalName ?? "",
    legalId: initial.legalId ?? "",
    city: initial.city ?? "",
    hero: initial.hero,
    pages: initial.pages,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  function handleSave() {
    setError(null);
    const accent = form.accent.trim();
    if (accent && !/^#[0-9a-f]{3,8}$/i.test(accent)) {
      setError("El color debe ser un código hexadecimal, por ejemplo #b85c32.");
      return;
    }
    const logoUrl = form.logoUrl.trim();
    if (logoUrl && !/^(https:\/\/|\/)\S+$/.test(logoUrl)) {
      setError("El logo debe ser una URL https o una ruta que empiece por /.");
      return;
    }
    startTransition(async () => {
      // Cadena vacía = borrar el dato (el backend fusiona el objeto).
      const result = await updateTenantAction(tenantId, {
        branding: {
          tagline: form.tagline.trim(),
          accent,
          logoUrl,
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          legalName: form.legalName.trim(),
          legalId: form.legalId.trim(),
          city: form.city.trim(),
          hero: form.hero,
          pages: form.pages,
        },
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const field = (
    key: "tagline" | "logoUrl" | "contactEmail" | "contactPhone" | "legalName" | "legalId" | "city",
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
        className={inputClass}
      />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {field("tagline", "Lema", "Tostadores de café de especialidad")}
        <label className="block text-sm font-medium">
          Color de acento
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              aria-label="Elegir color de acento"
              value={/^#[0-9a-f]{6}$/i.test(form.accent) ? form.accent : "#b85c32"}
              onChange={(e) => set("accent", e.target.value)}
              className="h-9 w-12 rounded border border-border bg-background p-0.5"
            />
            <input
              type="text"
              value={form.accent}
              placeholder="#b85c32"
              onChange={(e) => set("accent", e.target.value)}
              className={inputClass + " mt-0"}
            />
          </div>
        </label>
        {field("logoUrl", "Logo (URL de imagen)", "https://…/logo.png")}
        {field("city", "Ciudad", "Bogotá")}
        {field("contactEmail", "Correo de contacto", "hola@tutienda.com", "email")}
        {field("contactPhone", "Teléfono / WhatsApp", "+57 300 000 0000", "tel")}
        {field("legalName", "Razón social", "Mi Café S.A.S.")}
        {field("legalId", "NIT", "900.000.000-0")}
      </div>

      <div>
        <p className="text-sm font-medium">Portada del inicio</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["classic", "Clásica", "Texto y color de la marca"],
              ["scene3d", "Escena 3D", "La animación de la demo"],
            ] as const
          ).map(([value, label, help]) => (
            <button
              key={value}
              type="button"
              onClick={() => set("hero", value)}
              aria-pressed={form.hero === value}
              className={
                "rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                (form.hero === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40")
              }
            >
              <span className="font-medium">{label}</span>
              <span className="block text-xs opacity-70">{help}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Páginas con contenido propio</p>
        <p className="text-xs text-muted-foreground mb-2">
          Actívalas solo si la tienda tiene su propio contenido para ellas. Apagadas, la ruta no
          existe y no aparece en los menús.
        </p>
        <div className="rounded-md border border-border divide-y divide-border">
          {PAGES.map(({ key, label, help }) => {
            const on = form.pages[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{help}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={label}
                  onClick={() => set("pages", { ...form.pages, [key]: !on })}
                  className={
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
                    (on ? "bg-foreground" : "bg-muted-foreground/30")
                  }
                >
                  <span
                    className={
                      "inline-block size-4 transform rounded-full bg-background transition-transform " +
                      (on ? "translate-x-6" : "translate-x-1")
                    }
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar marca"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
            <Check className="size-4" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
