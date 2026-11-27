"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Check, Loader2, Archive, ArchiveRestore, Eye, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Roast } from "@/components/ui/roast";
import type { GrindFormat, Product, ProductImage, ProductStatus } from "@/lib/types";
import { GRIND_OPTIONS, sortGrinds } from "@/lib/grind";
import { formatCop } from "@/lib/format";
import { saveProductAction } from "@/lib/actions/admin-mutations";
import { ProductImages } from "./product-images";
import { OriginPicker } from "./origin-picker";

type VariantField = "priceOneTime" | "priceSubscription" | "compareAt" | "stock";

/**
 * Presentación (tamaño) con su precio, en pesos COP. Se replica para cada
 * molienda ofrecida. `initial` guarda lo cargado para saber qué tocó el
 * operador; `mixed` marca campos que hoy difieren entre moliendas.
 */
interface DraftSize {
  sizeGrams: number;
  priceOneTime: number;
  priceSubscription: number;
  /** Precio "antes" de la rebaja, tachado en la tienda. 0 = sin rebaja. */
  compareAt: number;
  stock: number;
  initial?: { sizeGrams: number; priceOneTime: number; priceSubscription: number; compareAt: number; stock: number };
  mixed?: Partial<Record<VariantField, string>>;
}

/** Variante para `saveProductAction` (pesos; la action convierte a centavos). */
export interface ExpandedVariant {
  sizeGrams: number;
  priceOneTime: number;
  priceSubscription: number;
  compareAt: number;
  stock: number;
  grind: GrindFormat;
  preserve?: VariantField[];
}

const DEFAULT_SIZE: DraftSize = { sizeGrams: 340, priceOneTime: 60_000, priceSubscription: 51_000, compareAt: 0, stock: 0 };

const pesos = (cents: number | null | undefined) => (cents ?? 0) / 100;

function sizesFromProduct(p?: Product): DraftSize[] {
  if (!p || p.variants.length === 0) return [{ ...DEFAULT_SIZE }];
  const groups = new Map<number, Product["variants"]>();
  for (const v of p.variants) {
    groups.set(v.sizeGrams, [...(groups.get(v.sizeGrams) ?? []), v]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([sizeGrams, vs]) => {
      const first = vs[0];
      const values = {
        sizeGrams,
        priceOneTime: pesos(first.priceOneTimeCents),
        priceSubscription: pesos(first.priceSubscriptionCents),
        compareAt: pesos(first.compareAtCents),
        stock: first.stock,
      };
      const mixed: DraftSize["mixed"] = {};
      const distinct = (pick: (v: Product["variants"][number]) => number) =>
        Array.from(new Set(vs.map(pick)));
      const stocks = distinct((v) => v.stock);
      if (stocks.length > 1) mixed.stock = stocks.join(" / ");
      const one = distinct((v) => v.priceOneTimeCents);
      if (one.length > 1) mixed.priceOneTime = one.map((c) => formatCop(c)).join(" / ");
      const sub = distinct((v) => v.priceSubscriptionCents ?? 0);
      if (sub.length > 1) mixed.priceSubscription = sub.map((c) => formatCop(c)).join(" / ");
      const cmp = distinct((v) => v.compareAtCents ?? 0);
      if (cmp.length > 1) mixed.compareAt = cmp.map((c) => (c ? formatCop(c) : "sin rebaja")).join(" / ");
      return { ...values, initial: values, mixed };
    });
}

function grindsFromProduct(p?: Product): GrindFormat[] {
  if (!p || p.variants.length === 0) return ["WHOLE_BEAN"];
  return sortGrinds(Array.from(new Set(p.variants.map((v) => v.grind))));
}

/** Una variante por cada combinación tamaño × molienda. */
export function expandVariants(sizes: DraftSize[], grinds: GrindFormat[]): ExpandedVariant[] {
  return sizes.flatMap((s) => {
    // Lo que el operador no cambió se conserva tal cual en cada variante
    // existente (p. ej. el stock propio de cada molienda).
    const preserve: VariantField[] =
      s.initial && s.initial.sizeGrams === s.sizeGrams
        ? (["priceOneTime", "priceSubscription", "compareAt", "stock"] as const).filter(
            (f) => s[f] === s.initial![f],
          )
        : [];
    return grinds.map((grind) => ({
      sizeGrams: s.sizeGrams,
      priceOneTime: s.priceOneTime,
      priceSubscription: s.priceSubscription,
      compareAt: s.compareAt,
      stock: s.stock,
      grind,
      preserve,
    }));
  });
}

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Más vendido",
  NEW: "Nuevo",
  LIMITED: "Edición limitada",
  SUBSCRIBER_ONLY: "Exclusivo suscriptores",
  SEASONAL: "Temporada",
};

/** Las conocidas se traducen; las libres ("PRECISIÓN") pasan a "Precisión". */
function badgeLabel(badge: string): string {
  const known = BADGE_LABEL[badge];
  if (known) return known;
  const lower = badge.trim().toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

/** Qué significa cada estado para el cliente de la tienda. */
const STATUS_OPTIONS: ChoiceOption<ProductStatus>[] = [
  {
    value: "ACTIVE",
    label: "Publicado",
    description: "Se ve en la tienda y los clientes lo pueden comprar.",
    icon: Eye,
  },
  {
    value: "DRAFT",
    label: "Borrador",
    description: "Solo lo ves tú en el admin, mientras lo terminas de preparar.",
    icon: PencilLine,
  },
  {
    value: "ARCHIVED",
    label: "Archivado",
    description: "Sale de la tienda. Los pedidos anteriores se conservan y puedes reactivarlo.",
    icon: Archive,
  },
];

const SUB_OPTIONS: ChoiceOption<Product["subscriptionAvailability"]>[] = [
  { value: "YES", label: "Compra y suscripción", description: "El cliente elige entre comprarlo una vez o suscribirse." },
  { value: "NO", label: "Solo compra única", description: "No se ofrece por suscripción." },
  { value: "SUBSCRIPTION_ONLY", label: "Solo suscripción", description: "Únicamente se vende como suscripción." },
];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.longDescription ?? product?.shortDescription ?? "");
  const [type, setType] = useState(product?.type ?? "BLEND");
  const [origin, setOrigin] = useState(product?.origin ?? "");
  const [story, setStory] = useState(product?.producerStory ?? "");
  const [roast, setRoast] = useState(product?.roastLevel ?? 5);
  const [flavors, setFlavors] = useState<string>(
    product?.flavorNotes.join(", ") ?? "",
  );
  const [badges, setBadges] = useState<string[]>(product?.badges ?? []);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "DRAFT");
  const [subAvail, setSubAvail] = useState(product?.subscriptionAvailability ?? "YES");
  const [sizes, setSizes] = useState<DraftSize[]>(sizesFromProduct(product));
  const [grinds, setGrinds] = useState<GrindFormat[]>(grindsFromProduct(product));
  // Producto nuevo: URLs ya subidas a Blob, pendientes de registrar al crear.
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Estado guardado (no el que se está editando): decide el aviso y el botón de archivar.
  const savedStatus = product?.status;
  const badgeKeys = [...Object.keys(BADGE_LABEL), ...badges.filter((b) => !BADGE_LABEL[b])];

  const toggleBadge = (b: string) =>
    setBadges((arr) => (arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b]));

  const toggleGrind = (g: GrindFormat) =>
    setGrinds((arr) => sortGrinds(arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g]));

  const updateSize = (i: number, patch: Partial<DraftSize>) =>
    setSizes((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSize = () => setSizes((arr) => [...arr, { ...DEFAULT_SIZE }]);
  const removeSize = (i: number) => setSizes((arr) => arr.filter((_, idx) => idx !== i));

  // Un accesorio no lleva molienda ni tueste: se guarda con una sola molienda
  // (la que ya tenga, o grano) para que cada tamaño sea una única variante.
  const isAccessory = type === "ACCESSORY";
  const effectiveGrinds: GrindFormat[] = isAccessory
    ? [grinds.includes("WHOLE_BEAN") ? "WHOLE_BEAN" : (grinds[0] ?? "WHOLE_BEAN")]
    : grinds;
  const variantCount = expandVariants(sizes, effectiveGrinds).length;

  const submitForm = (overrideStatus?: ProductStatus, onDone?: () => void) => {
    setFeedback(null);
    const finalStatus = overrideStatus ?? status;
    if (overrideStatus) setStatus(overrideStatus);

    startTransition(async () => {
      const res = await saveProductAction({
        id: product?.id,
        name,
        description,
        type,
        origin,
        producerStory: story,
        // El backend exige 1–9 aunque un accesorio no lo use.
        roastLevel: Math.min(9, Math.max(1, roast)),
        flavorNotes: flavors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        badges,
        status: finalStatus,
        subscriptionAvailability: subAvail,
        variants: expandVariants(sizes, effectiveGrinds),
        pendingImages: product?.id ? undefined : images,
      });

      onDone?.();
      if (res.ok) {
        setFeedback({ ok: true, text: res.message });
        if (!product?.id) {
          router.push("/admin/productos");
        } else {
          router.refresh();
        }
      } else {
        setFeedback({ ok: false, text: res.error });
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitForm();
      }}
      className="space-y-8"
    >
      {feedback && (
        <div
          className={
            "rounded-md border px-4 py-3 text-sm " +
            (feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-red-300/60 bg-red-50 text-red-800")
          }
        >
          {feedback.text}
        </div>
      )}
      {savedStatus === "ARCHIVED" && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Archive className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Este producto está archivado</p>
              <p className="text-sm text-muted-foreground">
                No aparece en tu tienda y nadie lo puede comprar. Los pedidos anteriores se conservan.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => submitForm("ACTIVE")}
            className="shrink-0"
          >
            <ArchiveRestore className="size-4" />
            Reactivar y publicar
          </Button>
        </div>
      )}
      <Section title="Identificación">
        <Field label="Nombre del producto" value={name} onChange={setName} placeholder="Mezcla del alba" />
        <TextArea
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="Notas de cata, sugerencias de preparación, historia..."
        />
      </Section>

      <Section title={isAccessory ? "Tipo de producto" : "Origen y tueste"}>
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Tipo de producto"
            value={type}
            onChange={(v) => setType(v as Product["type"])}
            options={[
              { value: "BLEND", label: "Mezcla" },
              { value: "SINGLE_ORIGIN", label: "Origen único" },
              { value: "DECAF", label: "Descafeinado" },
              { value: "ACCESSORY", label: "Accesorio" },
            ]}
          />
          {isAccessory ? (
            <Field
              label="Categoría"
              value={origin}
              onChange={setOrigin}
              placeholder="Herramienta de precisión"
            />
          ) : (
            <OriginPicker value={origin} onChange={setOrigin} />
          )}
        </div>

        {!isAccessory && (
          <>
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
                  value={Math.max(1, roast)}
                  onChange={(e) => setRoast(+e.target.value)}
                  className="flex-1 accent-foreground"
                />
                <Roast level={Math.max(1, roast)} showLabel={false} />
                <span className="text-sm font-medium tabular-nums w-8 text-right">
                  {Math.max(1, roast)}/9
                </span>
              </div>
            </div>
          </>
        )}

        <Field
          label={isAccessory ? "Características (separadas por coma)" : "Notas de sabor (separadas por coma)"}
          value={flavors}
          onChange={setFlavors}
          placeholder={isAccessory ? "0.1 g de precisión, cronómetro, USB-C" : "chocolate, nuez, caramelo"}
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

      {!isAccessory && (
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
      )}

      <Section title="Tamaños y precios">
        <div className="space-y-3">
          {sizes.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-3 items-start rounded-md border border-border bg-muted/20 p-3"
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
                hint={s.mixed?.priceOneTime && `Hoy por molienda: ${s.mixed.priceOneTime}`}
              />
              <NumberField
                label="Precio antes (COP)"
                value={s.compareAt}
                onChange={(n) => updateSize(i, { compareAt: n })}
                emptyWhenZero
                placeholder="Sin rebaja"
                {...compareAtHint(s)}
              />
              <NumberField
                label="Precio suscr. (COP)"
                value={s.priceSubscription}
                onChange={(n) => updateSize(i, { priceSubscription: n })}
                hint={
                  s.mixed?.priceSubscription
                    ? `Hoy por molienda: ${s.mixed.priceSubscription}`
                    : "0 = sin precio de suscripción"
                }
              />
              <NumberField
                label={isAccessory ? "Stock" : "Stock por molienda"}
                value={s.stock}
                onChange={(n) => updateSize(i, { stock: n })}
                hint={s.mixed?.stock && `Hoy: ${s.mixed.stock}. Si lo cambias, se aplica a todas.`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSize(i)}
                disabled={sizes.length === 1}
                aria-label="Eliminar tamaño"
                className="justify-self-end lg:mt-[25px]"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSize}>
            <Plus className="size-4" />
            Agregar tamaño
          </Button>
          {isAccessory ? (
            <p className="text-xs text-muted-foreground">
              Cada tamaño es una variante del accesorio. Se generarán{" "}
              <span className="font-medium text-foreground tabular-nums">{variantCount}</span>{" "}
              {variantCount === 1 ? "variante" : "variantes"}.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              El precio y el stock aplican a cada molienda marcada; lo que no cambies se
              conserva como está. Se generarán{" "}
              <span className="font-medium text-foreground tabular-nums">{variantCount}</span>{" "}
              variantes ({sizes.length} {sizes.length === 1 ? "tamaño" : "tamaños"} × {grinds.length}{" "}
              {grinds.length === 1 ? "molienda" : "moliendas"}).
            </p>
          )}
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          {badgeKeys.map((b) => (
            <button
              type="button"
              key={b}
              onClick={() => toggleBadge(b)}
              aria-pressed={badges.includes(b)}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (badges.includes(b)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {badgeLabel(b)}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Visibilidad en la tienda">
        <ChoiceCards
          name="status"
          label="Visibilidad en la tienda"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        {product?.id && status !== savedStatus && (
          <p className="text-xs text-muted-foreground">
            El cambio se aplica cuando guardes el producto.
          </p>
        )}
      </Section>

      <Section title="Cómo se vende">
        <ChoiceCards
          name="subscriptionAvailability"
          label="Cómo se vende"
          value={subAvail}
          onChange={setSubAvail}
          options={SUB_OPTIONS}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-3 sticky bottom-0 bg-muted/30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 border-t border-border">
        {product?.id && savedStatus !== "ARCHIVED" && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => setArchiveOpen(true)}
            className="mr-auto text-muted-foreground"
          >
            <Archive className="size-4" />
            Archivar producto
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => submitForm("DRAFT")}
        >
          Guardar como borrador
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
          {isPending ? "Guardando…" : "Guardar producto"}
        </Button>
      </div>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              ¿Archivar {name || "este producto"}?
            </DialogTitle>
            <DialogDescription>
              Deja de verse en la tienda y ya no se puede comprar ni agregar al carrito. Las
              suscripciones que lo tengan no se renuevan mientras esté archivado.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Los pedidos anteriores se conservan. Puedes reactivarlo cuando quieras desde la
            pestaña <span className="font-medium text-foreground">Archivados</span> de productos.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setArchiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => submitForm("ARCHIVED", () => setArchiveOpen(false))}
            >
              {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/** Opciones excluyentes en tarjetas: cada una dice qué implica, no solo su nombre. */
function ChoiceCards<T extends string>({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ChoiceOption<T>[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <label
            key={o.value}
            className={
              "relative flex cursor-pointer flex-col gap-1.5 rounded-md border p-4 transition-colors " +
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/30 " +
              (active
                ? "border-foreground bg-foreground/[0.03]"
                : "border-border hover:border-foreground/40")
            }
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="flex items-center gap-2 text-sm font-medium">
              {Icon && <Icon className="size-4 text-muted-foreground" />}
              {o.label}
              {active && <Check className="ml-auto size-4" />}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">{o.description}</span>
          </label>
        );
      })}
    </div>
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
    <span className="block admin-label mb-1.5">
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

/** Explica la rebaja de un tamaño: cuánto descuento muestra, o por qué no sirve. */
function compareAtHint(s: DraftSize): { hint: string; tone?: "error" } {
  if (s.mixed?.compareAt) return { hint: `Hoy por molienda: ${s.mixed.compareAt}` };
  if (!s.compareAt) return { hint: "Opcional. Se muestra tachado como rebaja." };
  if (s.compareAt <= s.priceOneTime) {
    return { hint: "Debe ser mayor que el precio para mostrarse como rebaja.", tone: "error" };
  }
  const pct = Math.round((1 - s.priceOneTime / s.compareAt) * 100);
  return { hint: `La tienda mostrará −${pct}% con este precio tachado.` };
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  tone,
  emptyWhenZero,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string | false;
  tone?: "error";
  /** Muestra el campo vacío (con `placeholder`) cuando vale 0. */
  emptyWhenZero?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        value={emptyWhenZero && value === 0 ? "" : value}
        onChange={(e) => onChange(+e.target.value)}
        min={0}
        placeholder={placeholder}
        aria-invalid={tone === "error" || undefined}
        className={
          "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 tabular-nums " +
          (tone === "error" ? "border-destructive/60" : "border-input")
        }
      />
      {hint && (
        <span className={"mt-1 block text-xs " + (tone === "error" ? "text-destructive" : "text-muted-foreground")}>
          {hint}
        </span>
      )}
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
