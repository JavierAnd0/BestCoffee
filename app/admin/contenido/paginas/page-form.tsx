"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { saveEditorialPageAction } from "@/lib/actions/admin-content";
import type {
  ContentPageSlug,
  EditorialPageContent,
  PageCta,
  PageHighlight,
  PageSection,
} from "@/lib/editorial-pages";
import { useContentForm } from "../_components/use-content-form";
import { FormError, FormSection, TextArea, TextField } from "../_components/fields";
import { FormActions } from "../_components/submit-button";

// Qué partes muestra cada página en la tienda: el formulario solo pide esas.
const LAYOUT: Record<
  ContentPageSlug,
  {
    caption: boolean;
    highlights: boolean;
    sectionsHeading: boolean;
    sectionImages: boolean;
    cta: boolean;
    secondaryCta: boolean;
    contact: boolean;
    sectionsTitle: string;
    sectionsHint: string;
  }
> = {
  historia: {
    caption: false,
    highlights: false,
    sectionsHeading: false,
    sectionImages: true,
    cta: false,
    secondaryCta: false,
    contact: false,
    sectionsTitle: "Texto",
    sectionsHint: "Bloques de texto en orden. Si el primero no tiene título, su primer párrafo se destaca.",
  },
  impacto: {
    caption: false,
    highlights: true,
    sectionsHeading: false,
    sectionImages: true,
    cta: false,
    secondaryCta: false,
    contact: false,
    sectionsTitle: "Texto",
    sectionsHint: "Bloques de texto debajo de las cifras.",
  },
  sostenibilidad: {
    caption: true,
    highlights: true,
    sectionsHeading: true,
    sectionImages: false,
    cta: true,
    secondaryCta: true,
    contact: false,
    sectionsTitle: "Pilares",
    sectionsHint: "Cada pilar se muestra como una tarjeta.",
  },
  mayoristas: {
    caption: true,
    highlights: false,
    sectionsHeading: false,
    sectionImages: false,
    cta: true,
    secondaryCta: false,
    contact: true,
    sectionsTitle: "Ventajas",
    sectionsHint: "Cada ventaja se muestra como una tarjeta.",
  },
};

type Keyed<T> = T & { key: number };
let nextKey = 0;
const keyed = <T,>(v: T): Keyed<T> => ({ ...v, key: nextKey++ });

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

const strip = <T extends { key: number }>({ key: _key, ...rest }: T) => {
  void _key;
  return rest;
};

export function PageForm({
  slug,
  content,
  active,
}: {
  slug: ContentPageSlug;
  content: EditorialPageContent | null;
  active: boolean;
}) {
  const layout = LAYOUT[slug];
  const { error, onSubmit, pending } = useContentForm(saveEditorialPageAction);

  const [head, setHead] = useState({
    eyebrow: content?.eyebrow ?? "",
    title: content?.title ?? "",
    intro: content?.intro ?? "",
    imageUrl: content?.imageUrl ?? "",
    imageAlt: content?.imageAlt ?? "",
    imageCaption: content?.imageCaption ?? "",
    sectionsEyebrow: content?.sectionsEyebrow ?? "",
    sectionsTitle: content?.sectionsTitle ?? "",
  });
  const [sections, setSections] = useState<Keyed<PageSection>[]>(() =>
    content?.sections.length ? content.sections.map((s) => keyed({ ...s })) : [keyed({ title: "", body: "" })],
  );
  const [highlights, setHighlights] = useState<Keyed<PageHighlight>[]>(() =>
    (content?.highlights ?? []).map((h) => keyed({ ...h })),
  );
  const [cta, setCta] = useState<PageCta>(content?.cta ?? {});
  const [contact, setContact] = useState({
    email: content?.contact?.email ?? "",
    phone: content?.contact?.phone ?? "",
  });

  const setH = (k: keyof typeof head) => (e: { target: { value: string } }) =>
    setHead((h) => ({ ...h, [k]: e.target.value }));
  const updateSection = (key: number, patch: Partial<PageSection>) =>
    setSections((l) => l.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const updateHighlight = (key: number, patch: Partial<PageHighlight>) =>
    setHighlights((l) => l.map((h) => (h.key === key ? { ...h, ...patch } : h)));

  // Lo que no se ve en esta página no se envía; la API sanea y valida el resto.
  const payload: EditorialPageContent = {
    eyebrow: head.eyebrow,
    title: head.title,
    intro: head.intro,
    imageUrl: head.imageUrl,
    imageAlt: head.imageAlt,
    ...(layout.caption && { imageCaption: head.imageCaption }),
    ...(layout.sectionsHeading && { sectionsEyebrow: head.sectionsEyebrow, sectionsTitle: head.sectionsTitle }),
    ...(layout.highlights && { highlights: highlights.map(strip) }),
    sections: sections.map(strip).map((s) => (layout.sectionImages ? s : { title: s.title, body: s.body })),
    ...(layout.cta && {
      cta: layout.secondaryCta
        ? cta
        : { title: cta.title, body: cta.body, label: cta.label, href: cta.href },
    }),
    ...(layout.contact && { contact }),
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="content" value={JSON.stringify(payload)} />
      <FormError error={error} />

      <FormSection title="Encabezado">
        <div className="grid sm:grid-cols-3 gap-4">
          <TextField label="Antetítulo (opcional)" maxLength={60} value={head.eyebrow} onChange={setH("eyebrow")} />
          <div className="sm:col-span-2">
            <TextField label="Título" required maxLength={160} value={head.title} onChange={setH("title")} />
          </div>
        </div>
        <TextArea
          label="Entradilla (opcional)"
          rows={3}
          maxLength={600}
          value={head.intro}
          onChange={setH("intro")}
          hint="Frase corta bajo el título."
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <ImageUploadField
            label="Imagen principal (opcional)"
            folder="pages"
            value={head.imageUrl}
            onChange={(url) => setHead((h) => ({ ...h, imageUrl: url }))}
            hint="Sube una imagen o pega su URL (https o /ruta)."
          />
          <TextField
            label="Descripción de la imagen"
            maxLength={200}
            value={head.imageAlt}
            onChange={setH("imageAlt")}
            hint="Para lectores de pantalla."
          />
        </div>
        {layout.caption && (
          <TextField
            label="Texto sobre la imagen (opcional)"
            maxLength={300}
            value={head.imageCaption}
            onChange={setH("imageCaption")}
          />
        )}
      </FormSection>

      {layout.highlights && (
        <FormSection title="Cifras">
          <p className="text-xs text-muted-foreground -mt-2">Hasta 8 datos destacados. Solo cifras reales de la tienda.</p>
          <ul className="space-y-3">
            {highlights.map((h, i) => (
              <li key={h.key} className="grid grid-cols-[6rem_1fr_auto] gap-2 items-end">
                <TextField
                  label={`Cifra ${i + 1}`}
                  maxLength={40}
                  value={h.value}
                  placeholder="+40"
                  onChange={(e) => updateHighlight(h.key, { value: e.target.value })}
                />
                <TextField
                  label="Qué mide"
                  maxLength={160}
                  value={h.label}
                  onChange={(e) => updateHighlight(h.key, { label: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar cifra ${i + 1}`}
                  onClick={() => setHighlights((l) => l.filter((x) => x.key !== h.key))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          {highlights.length < 8 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHighlights((l) => [...l, keyed({ value: "", label: "" })])}
            >
              <Plus className="size-4" />
              Añadir cifra
            </Button>
          )}
        </FormSection>
      )}

      <FormSection title={layout.sectionsTitle}>
        <p className="text-xs text-muted-foreground -mt-2">
          {layout.sectionsHint} Deja una línea en blanco entre párrafos; empieza una línea con «- » para una lista y
          escribe **así** para negrita.
        </p>
        {layout.sectionsHeading && (
          <div className="grid sm:grid-cols-3 gap-4">
            <TextField
              label="Antetítulo del bloque"
              maxLength={60}
              value={head.sectionsEyebrow}
              onChange={setH("sectionsEyebrow")}
            />
            <div className="sm:col-span-2">
              <TextField
                label="Título del bloque"
                maxLength={160}
                value={head.sectionsTitle}
                onChange={setH("sectionsTitle")}
              />
            </div>
          </div>
        )}
        <ol className="space-y-4">
          {sections.map((s, i) => (
            <li key={s.key} className="rounded-md border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {layout.sectionsTitle === "Texto" ? "Bloque" : layout.sectionsTitle.replace(/s$/, "")} {i + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => setSections((l) => move(l, i, -1))}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Bajar"
                    disabled={i === sections.length - 1}
                    onClick={() => setSections((l) => move(l, i, 1))}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar"
                    disabled={sections.length === 1}
                    onClick={() => setSections((l) => l.filter((x) => x.key !== s.key))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <TextField
                label="Título (opcional)"
                maxLength={160}
                value={s.title ?? ""}
                onChange={(e) => updateSection(s.key, { title: e.target.value })}
              />
              <TextArea
                label="Texto"
                rows={6}
                maxLength={8000}
                value={s.body ?? ""}
                onChange={(e) => updateSection(s.key, { body: e.target.value })}
              />
              {layout.sectionImages && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Imagen (opcional)"
                    folder="pages"
                    value={s.imageUrl ?? ""}
                    onChange={(url) => updateSection(s.key, { imageUrl: url })}
                    hint="Va debajo del texto del bloque."
                  />
                  <TextField
                    label="Descripción de la imagen"
                    maxLength={200}
                    value={s.imageAlt ?? ""}
                    onChange={(e) => updateSection(s.key, { imageAlt: e.target.value })}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
        {sections.length < 20 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSections((l) => [...l, keyed({ title: "", body: "" })])}
          >
            <Plus className="size-4" />
            Añadir {layout.sectionsTitle === "Texto" ? "bloque" : layout.sectionsTitle.toLowerCase().replace(/s$/, "")}
          </Button>
        )}
      </FormSection>

      {layout.cta && (
        <FormSection title={layout.contact ? "Contacto" : "Llamado final"}>
          <TextField
            label="Título"
            maxLength={160}
            value={cta.title ?? ""}
            onChange={(e) => setCta((c) => ({ ...c, title: e.target.value }))}
          />
          <TextArea
            label="Texto"
            rows={3}
            maxLength={600}
            value={cta.body ?? ""}
            onChange={(e) => setCta((c) => ({ ...c, body: e.target.value }))}
          />
          {layout.contact && (
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                label="Correo (opcional)"
                type="email"
                maxLength={200}
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                hint="Vacío: el correo de contacto de la tienda."
              />
              <TextField
                label="Teléfono (opcional)"
                maxLength={40}
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                hint="Vacío: el teléfono de contacto de la tienda."
              />
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Botón: texto (opcional)"
              maxLength={60}
              value={cta.label ?? ""}
              onChange={(e) => setCta((c) => ({ ...c, label: e.target.value }))}
            />
            <TextField
              label="Botón: enlace"
              maxLength={300}
              value={cta.href ?? ""}
              placeholder="/catalogo"
              onChange={(e) => setCta((c) => ({ ...c, href: e.target.value }))}
              hint="Ruta de la tienda (/catalogo), https://, mailto: o tel:"
            />
          </div>
          {layout.secondaryCta && (
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                label="Segundo botón: texto (opcional)"
                maxLength={60}
                value={cta.secondaryLabel ?? ""}
                onChange={(e) => setCta((c) => ({ ...c, secondaryLabel: e.target.value }))}
              />
              <TextField
                label="Segundo botón: enlace"
                maxLength={300}
                value={cta.secondaryHref ?? ""}
                placeholder="/impacto"
                onChange={(e) => setCta((c) => ({ ...c, secondaryHref: e.target.value }))}
              />
            </div>
          )}
        </FormSection>
      )}

      {!active && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activate" />
          Activar la página al guardar
        </label>
      )}

      <FormActions pending={pending} cancelHref="/admin/contenido/paginas" submitLabel="Guardar página" />
    </form>
  );
}
