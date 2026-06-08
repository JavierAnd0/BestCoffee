"use client";

import { useState } from "react";
import { Trash2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Roast } from "@/components/ui/roast";
import type { Product, ProductVariant } from "@/lib/types";

interface DraftVariant {
  sizeGrams: number;
  grind: ProductVariant["grind"];
  priceOneTime: number;
  priceSubscription: number;
  stock: number;
}

function variantsFromProduct(p?: Product): DraftVariant[] {
  if (!p) return [{ sizeGrams: 340, grind: "WHOLE_BEAN", priceOneTime: 60_000, priceSubscription: 51_000, stock: 0 }];
  return p.variants.map((v) => ({
    sizeGrams: v.sizeGrams,
    grind: v.grind,
    priceOneTime: v.priceOneTimeCents / 100,
    priceSubscription: (v.priceSubscriptionCents ?? 0) / 100,
    stock: v.stock,
  }));
}

const GRINDS: { value: ProductVariant["grind"]; label: string }[] = [
  { value: "WHOLE_BEAN", label: "Grano entero" },
  { value: "ESPRESSO", label: "Molido espresso" },
  { value: "FILTER", label: "Molido filtro" },
  { value: "FRENCH_PRESS", label: "Molido prensa" },
];

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Más vendido",
  NEW: "Nuevo",
  LIMITED: "Edición limitada",
  SUBSCRIBER_ONLY: "Exclusivo suscriptores",
  SEASONAL: "Temporada",
};

export function ProductForm({ product }: { product?: Product }) {
  const [name, setName] = useState(product?.name ?? "");
  const [shortDesc, setShortDesc] = useState(product?.shortDescription ?? "");
  const [longDesc, setLongDesc] = useState(product?.longDescription ?? "");
  const [type, setType] = useState(product?.type ?? "BLEND");
  const [origin, setOrigin] = useState(product?.origin ?? "");
  const [story, setStory] = useState(product?.producerStory ?? "");
  const [roast, setRoast] = useState(product?.roastLevel ?? 5);
  const [flavors, setFlavors] = useState<string>(
    product?.flavorNotes.join(", ") ?? "",
  );
  const [badges, setBadges] = useState<string[]>(product?.badges ?? []);
  const [status, setStatus] = useState(product?.status ?? "DRAFT");
  const [subAvail, setSubAvail] = useState(product?.subscriptionAvailability ?? "YES");
  const [variants, setVariants] = useState<DraftVariant[]>(variantsFromProduct(product));

  const toggleBadge = (b: string) =>
    setBadges((arr) => (arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b]));

  const updateVariant = (i: number, patch: Partial<DraftVariant>) =>
    setVariants((arr) => arr.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const addVariant = () =>
    setVariants((arr) => [...arr, { sizeGrams: 340, grind: "WHOLE_BEAN", priceOneTime: 60_000, priceSubscription: 51_000, stock: 0 }]);
  const removeVariant = (i: number) =>
    setVariants((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <form className="space-y-8">
      <Section title="Identificación">
        <Field label="Nombre del producto" value={name} onChange={setName} placeholder="Mezcla del alba" />
        <Field
          label="Descripción corta"
          value={shortDesc}
          onChange={setShortDesc}
          placeholder="Una línea que resuma el producto"
        />
        <TextArea
          label="Descripción larga"
          value={longDesc}
          onChange={setLongDesc}
          rows={4}
          placeholder="Notas de cata, sugerencias de preparación, historia..."
        />
      </Section>

      <Section title="Origen y tueste">
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Tipo de café"
            value={type}
            onChange={(v) => setType(v as Product["type"])}
            options={[
              { value: "BLEND", label: "Mezcla" },
              { value: "SINGLE_ORIGIN", label: "Origen único" },
              { value: "DECAF", label: "Descafeinado" },
            ]}
          />
          <Field label="País / región" value={origin} onChange={setOrigin} placeholder="Huila, Colombia" />
        </div>
        <TextArea
          label="Historia del productor"
          value={story}
          onChange={setStory}
          rows={3}
          placeholder="Nombre del productor, finca, altitud, variedad…"
        />

        <div>
          <Label>Nivel de tostado</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={9}
              value={roast}
              onChange={(e) => setRoast(+e.target.value)}
              className="flex-1 accent-foreground"
            />
            <Roast level={roast} showLabel={false} />
            <span className="text-sm font-medium tabular-nums w-8 text-right">{roast}/9</span>
          </div>
        </div>

        <Field
          label="Notas de sabor (separadas por coma)"
          value={flavors}
          onChange={setFlavors}
          placeholder="chocolate, nuez, caramelo"
        />
      </Section>

      <Section title="Imágenes">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-md border border-dashed border-border bg-muted/30 grid place-items-center text-xs text-muted-foreground"
            >
              {i === 0 ? <Upload className="size-5" /> : "+"}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Arrastra para reordenar. La primera imagen es la principal del catálogo.
        </p>
      </Section>

      <Section title="Variantes">
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end rounded-md border border-border bg-muted/20 p-3"
            >
              <NumberField
                label="Tamaño (g)"
                value={v.sizeGrams}
                onChange={(n) => updateVariant(i, { sizeGrams: n })}
              />
              <SelectField
                label="Molienda"
                value={v.grind}
                onChange={(g) => updateVariant(i, { grind: g as ProductVariant["grind"] })}
                options={GRINDS}
              />
              <NumberField
                label="Precio (COP)"
                value={v.priceOneTime}
                onChange={(n) => updateVariant(i, { priceOneTime: n })}
              />
              <NumberField
                label="Precio suscr."
                value={v.priceSubscription}
                onChange={(n) => updateVariant(i, { priceSubscription: n })}
              />
              <NumberField
                label="Stock"
                value={v.stock}
                onChange={(n) => updateVariant(i, { stock: n })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(i)}
                aria-label="Eliminar variante"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addVariant}>
            <Plus className="size-4" />
            Agregar variante
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          {Object.keys(BADGE_LABEL).map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => toggleBadge(b)}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (badges.includes(b)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {BADGE_LABEL[b]}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Estado y disponibilidad">
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Estado"
            value={status}
            onChange={(v) => setStatus(v as Product["status"])}
            options={[
              { value: "ACTIVE", label: "Activo" },
              { value: "DRAFT", label: "Borrador" },
              { value: "ARCHIVED", label: "Archivado" },
            ]}
          />
          <SelectField
            label="Disponible para suscripción"
            value={subAvail}
            onChange={(v) => setSubAvail(v as Product["subscriptionAvailability"])}
            options={[
              { value: "YES", label: "Sí" },
              { value: "NO", label: "No" },
              { value: "SUBSCRIPTION_ONLY", label: "Solo suscripción" },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
          <span>Vista previa de badges:</span>
          {badges.length === 0 && <span>(ninguno)</span>}
          {badges.map((b) => (
            <Badge key={b} variant="secondary" className="font-normal">
              {BADGE_LABEL[b]}
            </Badge>
          ))}
        </div>
      </Section>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-muted/30 -mx-8 px-8 py-4 border-t border-border">
        <Button type="button" variant="outline">
          Guardar como borrador
        </Button>
        <Button type="submit">Guardar producto</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-6 space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 resize-y"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
