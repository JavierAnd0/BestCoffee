"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBrewGuideAction } from "@/lib/actions/admin-content";
import { useContentForm } from "../_components/use-content-form";
import type { AdminBrewGuide, AdminBrewStep } from "@/lib/data/admin-content";
import { FieldLabel, FormError, FormSection, TextArea, TextField, inputClass } from "../_components/fields";
import { FormActions } from "../_components/submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";

type StepRow = AdminBrewStep & { key: number };

let nextKey = 0;
const row = (s?: Partial<AdminBrewStep>): StepRow => ({
  key: nextKey++,
  title: s?.title ?? "",
  body: s?.body ?? "",
  durationSec: s?.durationSec ?? 0,
});

export function GuideForm({ guide }: { guide?: AdminBrewGuide }) {
  const { error, onSubmit, pending } = useContentForm(saveBrewGuideAction);
  const [steps, setSteps] = useState<StepRow[]>(() =>
    guide?.steps.length ? guide.steps.map((s) => row(s)) : [row()],
  );

  const update = (key: number, patch: Partial<AdminBrewStep>) =>
    setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {guide && <input type="hidden" name="id" value={guide.id} />}
      <input
        type="hidden"
        name="steps"
        value={JSON.stringify(steps.map(({ title, body, durationSec }) => ({ title, body, durationSec })))}
      />
      <FormError error={error} />

      <FormSection>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Método" name="method" maxLength={80} defaultValue={guide?.method ?? ""} placeholder="V60" hint="Es el título grande de la guía." />
          <TextField label="Título interno" name="title" required maxLength={160} defaultValue={guide?.title} placeholder="Guía V60" />
        </div>
        <TextField
          label="Dirección (opcional)"
          name="slug"
          maxLength={120}
          defaultValue={guide?.slug}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="se-genera-del-metodo"
          className="font-mono"
          hint="Aparece en /guias/<dirección>. Minúsculas, números y guiones."
        />
        <TextArea label="Resumen" name="summary" rows={2} maxLength={600} defaultValue={guide?.summary ?? ""} />
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Tiempo total" name="totalTime" maxLength={40} defaultValue={guide?.totalTime ?? ""} placeholder="4 min" />
          <FieldLabel label="Dificultad">
            <select name="difficulty" defaultValue={guide?.difficulty ?? "Media"} className={inputClass}>
              <option value="Fácil">Fácil</option>
              <option value="Media">Media</option>
              <option value="Avanzada">Avanzada</option>
            </select>
          </FieldLabel>
        </div>
        <ImageUploadField
          label="Imagen de portada (opcional)"
          name="coverUrl"
          folder="guides"
          defaultValue={guide?.coverUrl ?? ""}
          hint="Sube una imagen (JPG, PNG, WebP o AVIF, hasta 8 MB) o pega su URL."
        />
      </FormSection>

      <FormSection title="Pasos">
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.key} className="rounded-md border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Paso {i + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" aria-label="Subir paso" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" aria-label="Bajar paso" disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Quitar paso"
                    onClick={() => setSteps((list) => list.filter((x) => x.key !== s.key))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-[1fr_140px] gap-3">
                <FieldLabel label="Título">
                  <input value={s.title} maxLength={120} onChange={(e) => update(s.key, { title: e.target.value })} className={inputClass} />
                </FieldLabel>
                <FieldLabel label="Duración (seg)">
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    value={s.durationSec}
                    onChange={(e) => update(s.key, { durationSec: Number(e.target.value) || 0 })}
                    className={inputClass + " tabular-nums"}
                  />
                </FieldLabel>
              </div>
              <FieldLabel label="Indicaciones">
                <textarea value={s.body} rows={2} maxLength={2000} onChange={(e) => update(s.key, { body: e.target.value })} className={inputClass} />
              </FieldLabel>
            </li>
          ))}
        </ol>
        <Button type="button" variant="outline" size="sm" onClick={() => setSteps((list) => [...list, row()])}>
          <Plus />
          Agregar paso
        </Button>
      </FormSection>

      <FormActions pending={pending} cancelHref="/admin/contenido/guias" submitLabel={guide ? "Guardar cambios" : "Crear guía"} />
    </form>
  );
}
