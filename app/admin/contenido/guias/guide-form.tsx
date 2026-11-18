"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Droplets, Plus, Thermometer, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBrewGuideAction } from "@/lib/actions/admin-content";
import { useContentForm } from "../_components/use-content-form";
import type { AdminBrewGuide, BrewDifficulty } from "@/lib/data/admin-content";
import { FormError, inputClass } from "../_components/fields";
import { FormActions } from "../_components/submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  EMPTY_RECIPE,
  GRIND_SUGGESTIONS,
  GUIDE_TEMPLATES,
  clock,
  humanDuration,
  parseClock,
  ratio,
  totalSeconds,
  type BrewRecipe,
  type BrewStepData,
  type GuideTemplate,
} from "@/lib/brew";

type StepRow = BrewStepData & { key: number; clockText: string };

let nextKey = 0;
const row = (s?: Partial<BrewStepData>): StepRow => ({
  key: nextKey++,
  title: s?.title ?? "",
  body: s?.body ?? "",
  durationSec: s?.durationSec ?? 0,
  waterG: s?.waterG ?? null,
  clockText: s?.durationSec ? clock(s.durationSec) : "",
});

const DIFFICULTIES: { value: BrewDifficulty; hint: string }[] = [
  { value: "Fácil", hint: "Sin equipo especial" },
  { value: "Media", hint: "Pide algo de práctica" },
  { value: "Avanzada", hint: "Equipo y técnica" },
];

/** Duración redondeada para las tarjetas de plantilla: "3 min", "14 h". */
const roughDuration = (sec: number) =>
  sec >= 3600 ? `${Math.round(sec / 3600)} h` : `${Math.max(1, Math.round(sec / 60))} min`;

const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5";

/**
 * Editor de guías: se empieza desde una plantilla del método, la receta calcula
 * la proporción sola y el tiempo total sale de la suma de los pasos.
 */
export function GuideForm({ guide }: { guide?: AdminBrewGuide }) {
  const { error, onSubmit, pending } = useContentForm(saveBrewGuideAction);

  const [method, setMethod] = useState(guide?.method ?? "");
  const [customTitle, setCustomTitle] = useState(
    guide && guide.title !== `Guía ${guide.method ?? ""}`.trim() ? guide.title : "",
  );
  const [slug, setSlug] = useState(guide?.slug ?? "");
  const [summary, setSummary] = useState(guide?.summary ?? "");
  const [difficulty, setDifficulty] = useState<BrewDifficulty>(guide?.difficulty ?? "Media");
  const [recipe, setRecipe] = useState<BrewRecipe>(guide?.recipe ?? EMPTY_RECIPE);
  const [steps, setSteps] = useState<StepRow[]>(() =>
    guide?.steps.length ? guide.steps.map((s) => row(s)) : [row()],
  );
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const title = customTitle.trim() || `Guía ${method.trim() || "de preparación"}`;
  const total = totalSeconds(steps);
  const lastWater = [...steps].reverse().find((s) => s.waterG)?.waterG ?? null;
  const r = ratio(recipe);
  const waterMismatch = lastWater && recipe.waterMl && Math.abs(lastWater - recipe.waterMl) > 5;

  const applyTemplate = (t: GuideTemplate | null) => {
    setTemplateId(t?.id ?? "blank");
    if (!t) {
      setMethod("");
      setSummary("");
      setDifficulty("Media");
      setRecipe(EMPTY_RECIPE);
      setSteps([row()]);
      return;
    }
    setMethod(t.method);
    setSummary(t.summary);
    setDifficulty(t.difficulty);
    setRecipe(t.recipe);
    setSteps(t.steps.map((s) => row(s)));
  };

  const update = (key: number, patch: Partial<StepRow>) =>
    setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const duplicate = (i: number) =>
    setSteps((list) => [...list.slice(0, i + 1), row(list[i]), ...list.slice(i + 1)]);
  const setR = (patch: Partial<BrewRecipe>) => setRecipe((x) => ({ ...x, ...patch }));
  const numOrNull = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v.replace(",", ".")) || 0));

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {guide && <input type="hidden" name="id" value={guide.id} />}
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="summary" value={summary} />
      <input type="hidden" name="difficulty" value={difficulty} />
      <input type="hidden" name="totalTime" value={humanDuration(total)} />
      <input type="hidden" name="recipe" value={JSON.stringify(recipe)} />
      <input
        type="hidden"
        name="steps"
        value={JSON.stringify(steps.map(({ title, body, durationSec, waterG }) => ({ title, body, durationSec, waterG })))}
      />
      <FormError error={error} />

      {/* ── Plantillas (solo al crear) ── */}
      {!guide && (
        <section>
          <h3 className="font-display text-xl font-semibold tracking-tight">¿Qué método vas a explicar?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige uno y te dejamos la receta y los pasos listos para ajustar a tu café.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {GUIDE_TEMPLATES.map((t) => (
              <TemplateButton
                key={t.id}
                active={templateId === t.id}
                onClick={() => applyTemplate(t)}
                title={t.method}
                meta={`${t.recipe.coffeeG} g · ${roughDuration(totalSeconds(t.steps))}`}
              />
            ))}
            <TemplateButton
              active={templateId === "blank"}
              onClick={() => applyTemplate(null)}
              title="En blanco"
              meta="Desde cero"
            />
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8 min-w-0">
          {/* ── Lo básico ── */}
          <Card title="Lo básico">
            <div>
              <label className={label} htmlFor="g-method">Método</label>
              <input
                id="g-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                maxLength={80}
                required
                placeholder="V60, Chemex, Prensa francesa…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-display text-2xl outline-none focus-visible:border-foreground/40"
              />
              <p className="mt-1 text-xs text-muted-foreground">Es el título grande que ve tu cliente.</p>
            </div>
            <div>
              <label className={label} htmlFor="g-summary">En una frase, ¿qué consigue este método?</label>
              <textarea
                id="g-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder="Una taza limpia y brillante que deja ver las notas frutales del café."
                className={inputClass}
              />
            </div>
            <div>
              <span className={label}>Dificultad</span>
              <div role="radiogroup" aria-label="Dificultad" className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={difficulty === d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={
                      "rounded-md border px-3 py-2 text-left transition-colors " +
                      (difficulty === d.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40")
                    }
                  >
                    <span className="block text-sm font-medium">{d.value}</span>
                    <span className={"block text-xs " + (difficulty === d.value ? "text-background/70" : "text-muted-foreground")}>
                      {d.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <ImageUploadField
              label="Foto de portada (opcional)"
              name="coverUrl"
              folder="guides"
              defaultValue={guide?.coverUrl ?? ""}
              hint="Idealmente el método en uso. Horizontal, JPG, PNG, WebP o AVIF hasta 8 MB."
            />

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={"size-4 transition-transform " + (moreOpen ? "rotate-180" : "")} />
                Más opciones
              </button>
              {moreOpen && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="g-title">Nombre interno</label>
                    <input
                      id="g-title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      maxLength={160}
                      placeholder={`Guía ${method || "V60"}`}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Solo para ti y para la pestaña del navegador.</p>
                  </div>
                  <div>
                    <label className={label} htmlFor="g-slug">Dirección</label>
                    <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground/40">
                      <span className="flex items-center bg-muted/40 px-2.5 text-xs text-muted-foreground">/guias/</span>
                      <input
                        id="g-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        maxLength={120}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        placeholder="se-crea-del-metodo"
                        className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── Receta ── */}
          <Card title="Receta" description="Lo que tu cliente necesita tener listo antes de empezar. Todo es opcional.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <UnitField label="Café" unit="g" value={recipe.coffeeG} onChange={(v) => setR({ coffeeG: numOrNull(v) })} placeholder="15" />
              <UnitField label="Agua" unit="ml" value={recipe.waterMl} onChange={(v) => setR({ waterMl: numOrNull(v) })} placeholder="250" />
              <div>
                <span className={label}>Proporción</span>
                <div className="flex h-[38px] items-center rounded-md bg-muted/40 px-3 text-sm tabular-nums">
                  {r ?? <span className="text-muted-foreground">Se calcula sola</span>}
                </div>
              </div>
              <UnitField label="Temperatura" unit="°C" value={recipe.tempC} onChange={(v) => setR({ tempC: numOrNull(v) })} placeholder="93" />
            </div>
            <div>
              <span className={label}>Molienda</span>
              <div className="flex flex-wrap gap-1.5">
                {GRIND_SUGGESTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={recipe.grind === g}
                    onClick={() => setR({ grind: recipe.grind === g ? "" : g })}
                    className={
                      "rounded-full border px-3 py-1 text-sm transition-colors " +
                      (recipe.grind === g ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40")
                    }
                  >
                    {g}
                  </button>
                ))}
                <input
                  value={GRIND_SUGGESTIONS.includes(recipe.grind as (typeof GRIND_SUGGESTIONS)[number]) ? "" : recipe.grind}
                  onChange={(e) => setR({ grind: e.target.value })}
                  maxLength={60}
                  placeholder="Otra: como sal de mesa…"
                  aria-label="Otra molienda"
                  className="h-8 min-w-40 flex-1 rounded-full border border-dashed border-border bg-transparent px-3 text-sm outline-none focus:border-foreground/40"
                />
              </div>
            </div>
          </Card>

          {/* ── Pasos ── */}
          <Card
            title="Pasos"
            description="Cada paso con su tiempo arma el temporizador que usa tu cliente mientras prepara."
          >
            <ol className="space-y-3">
              {steps.map((s, i) => {
                const prevWater = steps.slice(0, i).reverse().find((x) => x.waterG)?.waterG ?? 0;
                const waterBack = s.waterG != null && s.waterG < prevWater;
                return (
                  <li key={s.key} className="rounded-md border border-border bg-background">
                    <div className="flex items-center gap-3 border-b border-border px-3 py-2">
                      <span className="grid size-6 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background tabular-nums">
                        {i + 1}
                      </span>
                      <input
                        value={s.title}
                        maxLength={120}
                        onChange={(e) => update(s.key, { title: e.target.value })}
                        placeholder="Nombre del paso: Bloom, Vierte, Presiona…"
                        aria-label={`Nombre del paso ${i + 1}`}
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                      />
                      <div className="flex shrink-0 gap-0.5">
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Subir paso" title="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Bajar paso" title="Bajar" disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label="Duplicar paso" title="Duplicar" onClick={() => duplicate(i)}>
                          <Copy />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Quitar paso"
                          title="Quitar"
                          disabled={steps.length === 1}
                          onClick={() => setSteps((list) => list.filter((x) => x.key !== s.key))}
                          className="hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem]">
                      <textarea
                        value={s.body}
                        rows={2}
                        maxLength={2000}
                        onChange={(e) => update(s.key, { body: e.target.value })}
                        placeholder="Qué hacer, explicado como se lo dirías a un amigo."
                        aria-label={`Indicaciones del paso ${i + 1}`}
                        className={inputClass + " col-span-2 resize-y xl:col-span-1"}
                      />
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground" htmlFor={`d-${s.key}`}>
                          <Timer className="size-3" /> Tiempo
                        </label>
                        <input
                          id={`d-${s.key}`}
                          value={s.clockText}
                          inputMode="numeric"
                          placeholder="0:30"
                          onChange={(e) => update(s.key, { clockText: e.target.value, durationSec: parseClock(e.target.value) })}
                          onBlur={() => update(s.key, { clockText: s.durationSec ? clock(s.durationSec) : "" })}
                          className={inputClass + " tabular-nums"}
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">{humanDuration(s.durationSec) || "min:seg"}</p>
                      </div>
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground" htmlFor={`w-${s.key}`}>
                          <Droplets className="size-3" /> Agua hasta
                        </label>
                        <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground/40">
                          <input
                            id={`w-${s.key}`}
                            value={s.waterG ?? ""}
                            inputMode="decimal"
                            placeholder="—"
                            onChange={(e) => update(s.key, { waterG: numOrNull(e.target.value) })}
                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm tabular-nums outline-none"
                          />
                          <span className="flex items-center px-2 text-xs text-muted-foreground">g</span>
                        </div>
                        <p className={"mt-1 text-[11px] " + (waterBack ? "text-amber-800" : "text-muted-foreground")}>
                          {waterBack ? `Menos que el paso anterior (${prevWater} g)` : "Total en la báscula"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Button type="button" variant="outline" size="sm" onClick={() => setSteps((list) => [...list, row()])}>
              <Plus />
              Agregar paso
            </Button>
          </Card>
        </div>

        {/* ── Resumen en vivo ── */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="rounded-lg border border-border bg-background p-5">
            <p className={label}>Así la verá tu cliente</p>
            <p className="font-display text-2xl font-semibold leading-tight tracking-tight">{method || "Método"}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              <Stat icon={Timer} term="Tiempo total" value={total ? humanDuration(total) : "—"} />
              <Stat term="Dificultad" value={difficulty} />
              <Stat term="Café · agua" value={recipe.coffeeG || recipe.waterMl ? `${recipe.coffeeG ?? "—"} g · ${recipe.waterMl ?? "—"} ml` : "—"} />
              <Stat icon={Thermometer} term="Agua" value={recipe.tempC ? `${recipe.tempC} °C` : "—"} />
            </dl>

            {total > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs text-muted-foreground">Línea de tiempo · {clock(total)}</p>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  {steps.map((s, i) =>
                    s.durationSec ? (
                      <span
                        key={s.key}
                        title={`${i + 1}. ${s.title || "Paso"} · ${clock(s.durationSec)}`}
                        style={{ flexGrow: s.durationSec }}
                        className={i % 2 ? "bg-foreground/45" : "bg-foreground"}
                      />
                    ) : null,
                  )}
                </div>
                <ol className="mt-3 space-y-1 text-xs">
                  {steps.map((s, i) => (
                    <li key={s.key} className="flex justify-between gap-2">
                      <span className="truncate">
                        {i + 1}. {s.title || <span className="text-muted-foreground">Sin nombre</span>}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {s.waterG ? `${s.waterG} g · ` : ""}
                        {s.durationSec ? clock(s.durationSec) : "—"}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {(waterMismatch || steps.some((s) => !s.durationSec && s.title)) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 space-y-1.5">
              {waterMismatch && (
                <p>
                  El último vertido llega a {lastWater} g, pero la receta dice {recipe.waterMl} ml.
                </p>
              )}
              {steps.some((s) => !s.durationSec && s.title) && (
                <p>Hay pasos sin tiempo: en el temporizador el cliente los avanza a mano.</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <FormActions pending={pending} cancelHref="/admin/contenido/guias" submitLabel={guide ? "Guardar cambios" : "Publicar guía"} />
    </form>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-6 space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function TemplateButton({ active, onClick, title, meta }: { active: boolean; onClick: () => void; title: string; meta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-lg border px-3 py-3 text-left transition-colors " +
        (active ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40")
      }
    >
      <span className="block font-display text-base font-semibold leading-tight">{title}</span>
      <span className={"mt-0.5 block text-xs " + (active ? "text-background/70" : "text-muted-foreground")}>{meta}</span>
    </button>
  );
}

function UnitField({
  label: text,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className={label}>{text}</span>
      <span className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground/40">
        <input
          value={value ?? ""}
          inputMode="decimal"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm tabular-nums outline-none"
        />
        <span className="flex items-center px-2.5 text-xs text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

function Stat({ term, value, icon: Icon }: { term: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {term}
      </dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
