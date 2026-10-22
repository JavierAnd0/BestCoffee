"use client";

import { useState } from "react";
import { Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Roast } from "@/components/ui/roast";
import type { GrindFormat, Product, ProductImage } from "@/lib/types";
import { GRIND_OPTIONS, sortGrinds } from "@/lib/grind";
import { ProductImages } from "./product-images";

/** Presentación (tamaño) con su precio. Se replica para cada molienda ofrecida. */
interface DraftSize {
  sizeGrams: number;
  priceOneTime: number;
  priceSubscription: number;
  stock: number;
}

/** Variante tal como la espera la API (`CreateVariantDto`), precios en COP. */
export interface ExpandedVariant extends DraftSize {
  grind: GrindFormat;
}

const DEFAULT_SIZE: DraftSize = { sizeGrams: 340, priceOneTime: 60_000, priceSubscription: 51_000, stock: 0 };

function sizesFromProduct(p?: Product): DraftSize[] {
  if (!p || p.variants.length === 0) return [{ ...DEFAULT_SIZE }];
  const bySize = new Map<number, DraftSize>();
  for (const v of p.variants) {
    if (bySize.has(v.sizeGrams)) continue;
    bySize.set(v.sizeGrams, {
      sizeGrams: v.sizeGrams,
      priceOneTime: v.priceOneTimeCents / 100,
      priceSubscription: (v.priceSubscriptionCents ?? 0) / 100,
      stock: v.stock,
    });
  }
  return Array.from(bySize.values()).sort((a, b) => a.sizeGrams - b.sizeGrams);
}

function grindsFromProduct(p?: Product): GrindFormat[] {
  if (!p || p.variants.length === 0) return ["WHOLE_BEAN"];
  return sortGrinds(Array.from(new Set(p.variants.map((v) => v.grind))));
}

/** Una variante por cada combinación tamaño × molienda. */
export function expandVariants(sizes: DraftSize[], grinds: GrindFormat[]): ExpandedVariant[] {
  return sizes.flatMap((s) => grinds.map((grind) => ({ ...s, grind })));
}

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
  const [sizes, setSizes] = useState<DraftSize[]>(sizesFromProduct(product));
  const [grinds, setGrinds] = useState<GrindFormat[]>(grindsFromProduct(product));
  // Producto nuevo: URLs ya subidas a Blob, pendientes de registrar al crear.
  const [, setImages] = useState<ProductImage[]>(product?.images ?? []);

  const toggleBadge = (b: string) =>
    setBadges((arr) => (arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b]));

  const toggleGrind = (g: GrindFormat) =>
    setGrinds((arr) => sortGrinds(arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g]));

  const updateSize = (i: number, patch: Partial<DraftSize>) =>
    setSizes((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSize = () => setSizes((arr) => [...arr, { ...DEFAULT_SIZE }]);
  const removeSize = (i: number) => setSizes((arr) => arr.filter((_, idx) => idx !== i));

  const variantCount = expandVariants(sizes, grinds).length;

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
        <ProductImages
          productId={product?.id}
          initial={product?.images ?? []}
          productName={name}
          onChange={setImages}
        />
      </Section>

      <Section title="Molienda">
        <p className="text-sm text-muted-foreground">
          Marca las moliendas que ofreces para este café. El cliente elegirá una al comprar.
        </p>
        <div className="flex flex-wrap gap-2">
          {GRIND_OPTIONS.map((g) => {
            const active = grinds.includes(g.value);
            return (
              <button
                type="button"
                key={g.value}
                onClick={() => toggleGrind(g.value)}
                aria-pressed={active}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors " +
                  (active
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
                }
              >
                <span
                  className={
                    "grid size-4 place-items-center rounded-sm border " +
                    (active ? "border-background" : "border-current")
                  }
                >
                  {active && <Check className="size-3" />}
                </span>
                {g.label}
              </button>
            );
          })}
        </div>
        {grinds.length === 0 && (
          <p className="text-xs text-destructive">Selecciona al menos una molienda.</p>
        )}
      </Section>

      <Section title="Tamaños y precios">
        <div className="space-y-3">
          {sizes.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end rounded-md border border-border bg-muted/20 p-3"
            >
              <NumberField
                label="Tamaño (g)"
                value={s.sizeGrams}
                onChange={(n) => updateSize(i, { sizeGrams: n })}
              />
              <NumberField
                label="Precio (COP)"
                value={s.priceOneTime}
                onChange={(n) => updateSize(i, { priceOneTime: n })}
              />
              <NumberField
                label="Precio suscr."
                value={s.priceSubscription}
                onChange={(n) => updateSize(i, { priceSubscription: n })}
              />
              <NumberField
                label="Stock"
                value={s.stock}
                onChange={(n) => updateSize(i, { stock: n })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSize(i)}
                disabled={sizes.length === 1}
                aria-label="Eliminar tamaño"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSize}>
            <Plus className="size-4" />
            Agregar tamaño
          </Button>
          <p className="text-xs text-muted-foreground">
            El precio aplica a todas las moliendas marcadas. Se generarán{" "}
            <span className="font-medium text-foreground tabular-nums">{variantCount}</span>{" "}
            variantes ({sizes.length} {sizes.length === 1 ? "tamaño" : "tamaños"} × {grinds.length}{" "}
            {grinds.length === 1 ? "molienda" : "moliendas"}).
          </p>
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
