"use client";

import { saveContentBlockAction } from "@/lib/actions/admin-content";
import { useContentForm } from "../_components/use-content-form";
import type { ContentBlock, ContentKind } from "@/lib/data/admin-content";
import { FieldLabel, FormError, FormSection, TextField, inputClass, toLocalInput } from "../_components/fields";
import { FormActions } from "../_components/submit-button";
import { BLOCK_KINDS } from "../_components/block-kinds";

export interface ProductOption {
  slug: string;
  name: string;
}

function str(data: Record<string, unknown> | undefined, key: string): string {
  const v = data?.[key];
  return typeof v === "string" ? v : "";
}

function ctaOf(data: Record<string, unknown> | undefined): { label: string; href: string } {
  const c = data?.cta as { label?: unknown; href?: unknown } | undefined;
  return {
    label: typeof c?.label === "string" ? c.label : "",
    href: typeof c?.href === "string" ? c.href : "",
  };
}

export function BlockForm({
  kind,
  block,
  products,
  inline,
}: {
  kind: ContentKind;
  block?: ContentBlock;
  products: ProductOption[];
  /** Abierto dentro de la lista de bloques, sin cambiar de página. */
  inline?: boolean;
}) {
  const { error, onSubmit, pending } = useContentForm(saveContentBlockAction);
  const data = block?.data;
  const cta = ctaOf(data);
  const bundle = Array.isArray(data?.productSlugs) ? (data.productSlugs as string[]) : [];

  return (
    <form onSubmit={onSubmit} className={inline ? "space-y-6" : "space-y-6 max-w-3xl"}>
      {block && <input type="hidden" name="id" value={block.id} />}
      <input type="hidden" name="kind" value={kind} />
      {!inline && <p className="text-sm text-muted-foreground">{BLOCK_KINDS[kind].where}</p>}
      <FormError error={error} />

      <FormSection plain={inline}>
        {kind === "ANNOUNCEMENT" && (
          <TextField label="Texto" name="text" required maxLength={200} defaultValue={str(data, "text")} />
        )}
        {kind === "HERO" && (
          <>
            <TextField label="Titular" name="title" required maxLength={120} defaultValue={str(data, "title")} />
            <TextField label="Subtítulo (opcional)" name="subtitle" maxLength={240} defaultValue={str(data, "subtitle")} />
            <TextField
              label="Imagen principal (URL)"
              name="imageDesktop"
              required
              maxLength={500}
              defaultValue={str(data, "imageDesktop")}
              placeholder="https://"
            />
            <TextField label="Imagen para móvil (URL, opcional)" name="imageMobile" maxLength={500} defaultValue={str(data, "imageMobile")} placeholder="https://" />
          </>
        )}
        {(kind === "ANNOUNCEMENT" || kind === "HERO") && (
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Texto del botón (opcional)" name="ctaLabel" maxLength={60} defaultValue={cta.label} />
            <TextField label="Enlace del botón" name="ctaHref" maxLength={300} defaultValue={cta.href} placeholder="/catalogo" />
          </div>
        )}
        {kind === "SPOTLIGHT" && (
          <>
            <FieldLabel label="Producto">
              <select name="productSlug" required defaultValue={str(data, "productSlug")} className={inputClass}>
                <option value="">Elige un producto</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </FieldLabel>
            <TextField label="Título (opcional)" name="title" maxLength={120} defaultValue={str(data, "title")} hint="Sin título se usa el nombre del producto." />
          </>
        )}
        {kind === "FEATURED_BUNDLE" && (
          <>
            <TextField label="Título" name="title" required maxLength={120} defaultValue={str(data, "title")} />
            <fieldset>
              <legend className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                Productos del paquete
              </legend>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos en el catálogo.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto rounded-md border border-border p-3">
                  {products.map((p) => (
                    <label key={p.slug} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 accent-foreground" name="productSlugs" value={p.slug} defaultChecked={bundle.includes(p.slug)} />
                      {p.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </>
        )}
      </FormSection>

      <FormSection plain={inline} title="Visibilidad">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-foreground" name="active" defaultChecked={block?.active ?? true} />
          Activo
        </label>
        <div className={inline ? "grid grid-cols-2 gap-4" : "grid sm:grid-cols-3 gap-4"}>
          <FieldLabel label="Desde (opcional)">
            <input type="datetime-local" name="startsAt" defaultValue={toLocalInput(block?.startsAt)} className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Hasta (opcional)">
            <input type="datetime-local" name="endsAt" defaultValue={toLocalInput(block?.endsAt)} className={inputClass} />
          </FieldLabel>
          <TextField label="Orden" name="position" type="number" min={0} defaultValue={block?.position ?? 0} hint="El número más bajo va primero. Si hay dos portadas visibles, se muestra la de número más bajo." />
        </div>
      </FormSection>

      <FormActions
        pending={pending}
        cancelHref="/admin/contenido"
        keepScroll={inline}
        submitLabel={block ? "Guardar cambios" : "Crear bloque"}
      />
    </form>
  );
}
