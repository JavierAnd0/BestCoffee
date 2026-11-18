"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Droplets, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Thermometer, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { grams, humanDuration, ratio, totalSeconds, type BrewRecipe } from "@/lib/brew";
import { Tooltip } from "@/components/ui/tooltip";

type Step = { title: string; body: string; durationSec: number; waterG?: number | null };

const SCALES = [0.5, 1, 1.5, 2, 3, 4];

/** Reloj de cuenta regresiva: "4:05" o "13:59:40" para reposos largos. */
function countdown(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/**
 * Receta con calculadora de cantidades + pasos con modo preparación: un
 * temporizador que avanza paso a paso, pensado para usarse con el celular
 * al lado de la báscula.
 */
export function BrewGuide({ recipe, steps }: { recipe: BrewRecipe | null; steps: Step[] }) {
  const [scaleIdx, setScaleIdx] = useState(1);
  const scale = SCALES[scaleIdx];
  const hasRecipe = !!recipe && (recipe.coffeeG || recipe.waterMl || recipe.tempC || recipe.grind);
  const canTime = steps.length > 0;

  // ── Modo preparación ──
  const [brewing, setBrewing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedInStep, setElapsedInStep] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null); // marca de tiempo del último "play"
  const baseElapsed = useRef(0); // segundos acumulados antes del último "play"
  const panelRef = useRef<HTMLDivElement>(null);

  const step = steps[current];
  const stepLen = step?.durationSec ?? 0;
  const remaining = Math.max(0, stepLen - elapsedInStep);
  const elapsedTotal = totalSeconds(steps.slice(0, current)) + Math.min(elapsedInStep, stepLen || elapsedInStep);
  const total = totalSeconds(steps);

  const signal = useCallback(() => {
    try {
      navigator.vibrate?.(180);
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      osc.onended = () => void ctx.close();
    } catch {
      /* sin sonido disponible: el cambio de paso se ve igual */
    }
  }, []);

  const goTo = useCallback(
    (i: number, keepRunning: boolean) => {
      baseElapsed.current = 0;
      startedAt.current = keepRunning ? Date.now() : null;
      setElapsedInStep(0);
      setCurrent(i);
      setRunning(keepRunning);
      setDone(false);
    },
    [],
  );

  const next = useCallback(() => {
    if (current >= steps.length - 1) {
      setRunning(false);
      startedAt.current = null;
      setDone(true);
      signal();
      return;
    }
    goTo(current + 1, true);
    signal();
  }, [current, steps.length, goTo, signal]);

  // El intervalo lee el paso actual y "siguiente" por refs, sin reiniciarse.
  const nextRef = useRef(next);
  const stepLenRef = useRef(stepLen);
  useEffect(() => {
    nextRef.current = next;
    stepLenRef.current = stepLen;
  });

  // Reloj basado en marcas de tiempo (no se desfasa si la pestaña se duerme).
  // Al cumplirse el tiempo de un paso, pasa al siguiente solo.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startedAt.current == null) return;
      const elapsed = baseElapsed.current + (Date.now() - startedAt.current) / 1000;
      if (stepLenRef.current > 0 && elapsed >= stepLenRef.current) nextRef.current();
      else setElapsedInStep(elapsed);
    };
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running]);

  // Mantener la pantalla encendida mientras se prepara.
  useEffect(() => {
    if (!brewing || !running) return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => void lock?.release().catch(() => undefined);
  }, [brewing, running]);

  const start = () => {
    setBrewing(true);
    goTo(0, true);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const toggle = () => {
    if (done) return goTo(0, true);
    if (running) {
      baseElapsed.current = elapsedInStep;
      startedAt.current = null;
      setRunning(false);
    } else {
      startedAt.current = Date.now();
      setRunning(true);
    }
  };
  const exit = () => {
    setBrewing(false);
    setRunning(false);
    startedAt.current = null;
    setDone(false);
  };

  const water = (g: number | null | undefined) => (g ? `${grams(g * scale)} g` : null);

  return (
    <div className="mt-12 space-y-10">
      {/* ── Receta ── */}
      {hasRecipe && recipe && (
        <section aria-labelledby="receta" className="rounded-lg border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id="receta" className="font-display text-2xl font-semibold tracking-tight">
              Receta
            </h2>
            {(recipe.coffeeG || recipe.waterMl) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Cantidad</span>
                <div className="flex items-center rounded-full border border-border">
                  <Tooltip content="Menos cantidad">
                    <button
                      type="button"
                      aria-label="Menos cantidad"
                      disabled={scaleIdx === 0}
                      onClick={() => setScaleIdx((i) => i - 1)}
                      className="grid size-8 place-items-center rounded-full disabled:opacity-40 hover:bg-muted"
                    >
                      <Minus className="size-3.5" />
                    </button>
                  </Tooltip>
                  <span className="min-w-12 text-center font-medium tabular-nums" aria-live="polite">
                    ×{String(scale).replace(".", ",")}
                  </span>
                  <Tooltip content="Más cantidad">
                    <button
                      type="button"
                      aria-label="Más cantidad"
                      disabled={scaleIdx === SCALES.length - 1}
                      onClick={() => setScaleIdx((i) => i + 1)}
                      className="grid size-8 place-items-center rounded-full disabled:opacity-40 hover:bg-muted"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
          <dl className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
            {recipe.coffeeG && <RecipeStat term="Café" value={`${grams(recipe.coffeeG * scale)} g`} />}
            {recipe.waterMl && <RecipeStat term="Agua" value={`${grams(recipe.waterMl * scale)} ml`} />}
            {ratio(recipe) && <RecipeStat term="Proporción" value={ratio(recipe)!} />}
            {recipe.tempC && <RecipeStat term="Temperatura" value={`${recipe.tempC} °C`} icon={Thermometer} />}
          </dl>
          {recipe.grind && (
            <p className="border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">Molienda: </span>
              <span className="font-medium">{recipe.grind}</span>
            </p>
          )}
        </section>
      )}

      {/* ── Pasos ── */}
      <section aria-labelledby="pasos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="pasos" className="font-display text-2xl font-semibold tracking-tight">
            Paso a paso
          </h2>
          {canTime && !brewing && (
            <Button type="button" onClick={start}>
              <Play className="size-4" />
              Preparar con temporizador
            </Button>
          )}
        </div>

        {brewing && step && (
          <div
            ref={panelRef}
            className="sticky top-20 z-20 mt-6 scroll-mt-24 overflow-hidden rounded-lg bg-foreground text-background shadow-xl"
            role="region"
            aria-label="Modo preparación"
          >
            <div className="h-1 bg-background/15">
              <div
                className="h-full bg-[var(--accent)] transition-[width] duration-300 ease-linear"
                style={{ width: `${total ? Math.min(100, (elapsedTotal / total) * 100) : 0}%` }}
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.16em] text-background/60">
                  {done ? "Listo" : `Paso ${current + 1} de ${steps.length}`}
                </p>
                <Tooltip content="Salir del modo preparación">
                  <button type="button" onClick={exit} aria-label="Salir del modo preparación" className="text-background/60 hover:text-background">
                    <X className="size-4" />
                  </button>
                </Tooltip>
              </div>

              {done ? (
                <div className="py-4">
                  <p className="font-display text-4xl font-semibold tracking-tight">Tu café está listo.</p>
                  <p className="mt-2 text-sm text-background/70">Sirve y disfrútalo. Si lo sentiste amargo, prueba una molienda un poco más gruesa la próxima vez.</p>
                </div>
              ) : (
                <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="min-w-0">
                    <p className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{step.title}</p>
                    {step.body && <p className="mt-2 text-base leading-relaxed text-background/80">{step.body}</p>}
                    {step.waterG ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-sm">
                        <Droplets className="size-3.5" /> Vierte hasta <strong className="tabular-nums">{water(step.waterG)}</strong>
                      </p>
                    ) : null}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-sans text-6xl font-medium tracking-tight tabular-nums leading-none" aria-live="off">
                      {stepLen ? countdown(remaining) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-background/60">
                      {stepLen ? "quedan en este paso" : "sin tiempo: avanza cuando termines"}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button type="button" onClick={toggle} className="bg-background text-foreground hover:bg-background/90">
                  {done ? <RotateCcw className="size-4" /> : running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {done ? "Preparar otra vez" : running ? "Pausar" : "Continuar"}
                </Button>
                {!done && (
                  <Button type="button" variant="ghost" onClick={next} className="text-background hover:bg-background/10 hover:text-background">
                    <SkipForward className="size-4" />
                    {current === steps.length - 1 ? "Terminar" : stepLen ? "Saltar al siguiente" : "Listo, siguiente"}
                  </Button>
                )}
                {!done && current < steps.length - 1 && (
                  <p className="ml-auto hidden text-xs text-background/60 sm:block">
                    Sigue: <span className="text-background/90">{steps[current + 1].title}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <ol className="mt-6 space-y-2">
          {steps.map((s, i) => {
            const active = brewing && !done && i === current;
            const past = brewing && (done || i < current);
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!brewing}
                  onClick={() => goTo(i, running)}
                  className={
                    "grid w-full grid-cols-[auto_1fr] gap-4 rounded-lg p-4 text-left transition-colors disabled:cursor-default " +
                    (active ? "bg-muted" : brewing ? "hover:bg-muted/50" : "")
                  }
                >
                  <span
                    className={
                      "grid size-9 place-items-center rounded-full font-sans text-sm font-semibold tabular-nums transition-colors " +
                      (active
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : past
                          ? "bg-foreground/15 text-foreground/60"
                          : "bg-foreground text-background")
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={"block font-display text-xl font-semibold tracking-tight " + (past ? "text-foreground/60" : "")}>
                      {s.title}
                    </span>
                    {s.body && <span className="mt-1 block text-base leading-relaxed text-foreground/85">{s.body}</span>}
                    {(s.durationSec > 0 || s.waterG) && (
                      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {s.durationSec > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Timer className="size-3" /> {humanDuration(s.durationSec)}
                          </span>
                        )}
                        {s.waterG ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Droplets className="size-3" /> Hasta {water(s.waterG)}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function RecipeStat({ term, value, icon: Icon }: { term: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="px-5 py-4">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {term}
      </dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
