"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coffee, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Choice } from "@/components/ui/choice";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Roast } from "@/components/ui/roast";
import { Badge } from "@/components/ui/badge";
import { formatCop } from "@/lib/format";
import { PRODUCTS } from "@/lib/mocks/products";
import type { Product, ProductType } from "@/lib/types";

type Frequency = "DAILY" | "SOMETIMES" | "RARELY";
type FlavorBucket = "FRUITY" | "CHOCOLATE" | "FLORAL" | "SPICY";
type Method = "FILTER" | "PRESS" | "ESPRESSO" | "COLD";
type Form = "WHOLE_BEAN" | "GROUND";
type Caffeine = "FULL" | "MEDIUM" | "DECAF";

interface Answers {
  frequency: Frequency | null;
  flavors: FlavorBucket[];
  method: Method | null;
  form: Form | null;
  caffeine: Caffeine | null;
}

const EMPTY: Answers = {
  frequency: null,
  flavors: [],
  method: null,
  form: null,
  caffeine: null,
};

// Map flavor buckets to the product's free-form notes so scoring stays
// resilient as the catalog grows.
const FLAVOR_KEYWORDS: Record<FlavorBucket, string[]> = {
  FRUITY: ["frutal", "frutas", "cítrico", "cereza", "durazno", "rojas"],
  CHOCOLATE: ["chocolate", "cacao", "melaza", "caramelo", "nuez"],
  FLORAL: ["jazmín", "floral", "té", "miel"],
  SPICY: ["especiado", "tabaco", "panela"],
};

// Method preferences roughly map onto roast bands.
const METHOD_ROAST_BAND: Record<Method, [number, number]> = {
  FILTER: [2, 5],
  PRESS: [4, 7],
  ESPRESSO: [5, 7],
  COLD: [4, 7],
};

function score(product: Product, a: Answers): number {
  let s = 0;

  // caffeine gate
  if (a.caffeine === "DECAF" && product.type !== "DECAF") return -100;
  if (a.caffeine !== "DECAF" && product.type === "DECAF") s -= 5;

  // roast band by method
  if (a.method) {
    const [lo, hi] = METHOD_ROAST_BAND[a.method];
    if (product.roastLevel >= lo && product.roastLevel <= hi) s += 4;
    else s -= Math.min(Math.abs(product.roastLevel - lo), Math.abs(product.roastLevel - hi));
  }

  // flavor matches — each bucket adds up to 3 points
  for (const b of a.flavors) {
    const kws = FLAVOR_KEYWORDS[b];
    const hit = product.flavorNotes.some((n) =>
      kws.some((kw) => n.toLowerCase().includes(kw)),
    );
    if (hit) s += 3;
  }

  // single-origin gets a slight bump for users with more sophisticated picks
  if (a.flavors.length >= 2 && product.type === "SINGLE_ORIGIN") s += 1;

  // bestsellers nudge for the casual "rarely" drinker
  if (a.frequency === "RARELY" && product.badges.includes("BESTSELLER")) s += 1;

  // form preference: most cards have multiple grinds; only nudge if all
  // variants are wholebean and the user wants ground (or vice versa).
  if (a.form) {
    const targets = a.form === "WHOLE_BEAN" ? ["WHOLE_BEAN"] : ["FILTER", "ESPRESSO", "FRENCH_PRESS"];
    const has = product.variants.some((v) => targets.includes(v.grind));
    if (!has) s -= 2;
  }

  return s;
}

function recommend(a: Answers): Product | null {
  const ranked = PRODUCTS.map((p) => ({ p, s: score(p, a) })).sort((x, y) => y.s - x.s);
  return ranked[0]?.p ?? null;
}

const STEPS = ["frequency", "flavors", "method", "form", "caffeine"] as const;
type Step = (typeof STEPS)[number];

const TOTAL = STEPS.length;

export function QuizWizard() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [done, setDone] = useState(false);

  const current = STEPS[step];
  const result = useMemo(() => (done ? recommend(a) : null), [done, a]);

  const next = () => (step < TOTAL - 1 ? setStep(step + 1) : setDone(true));
  const back = () => (step > 0 ? setStep(step - 1) : undefined);
  const reset = () => {
    setA(EMPTY);
    setStep(0);
    setDone(false);
  };

  const valid = isValid(current, a);

  if (done && result) return <Result product={result} onReset={reset} />;

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center bg-background">
      <div className="w-full max-w-2xl px-4 sm:px-6 py-12">
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            aria-label="Salir del quiz"
            className="grid place-items-center size-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <X className="size-4" />
          </Link>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground transition-[width] duration-300"
              style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {step + 1} / {TOTAL}
          </span>
        </header>

        <div className="space-y-8">
          {current === "frequency" && (
            <Question
              eyebrow="Pregunta 1"
              q="¿Con qué frecuencia tomas café?"
              options={[
                { value: "DAILY", label: "Todos los días" },
                { value: "SOMETIMES", label: "Algunos días" },
                { value: "RARELY", label: "De vez en cuando" },
              ]}
              picked={a.frequency}
              onPick={(v) => setA({ ...a, frequency: v as Frequency })}
            />
          )}

          {current === "flavors" && (
            <Question
              eyebrow="Pregunta 2"
              q="¿Qué perfiles de sabor prefieres?"
              hint="Elige las que apliquen"
              options={[
                { value: "FRUITY", label: "Frutal y ácido" },
                { value: "CHOCOLATE", label: "Chocolatoso" },
                { value: "FLORAL", label: "Floral" },
                { value: "SPICY", label: "Especiado" },
              ]}
              multi
              pickedMulti={a.flavors}
              onPickMulti={(v) =>
                setA({
                  ...a,
                  flavors: a.flavors.includes(v as FlavorBucket)
                    ? a.flavors.filter((x) => x !== v)
                    : [...a.flavors, v as FlavorBucket],
                })
              }
            />
          )}

          {current === "method" && (
            <Question
              eyebrow="Pregunta 3"
              q="¿Cómo lo preparas en casa?"
              options={[
                { value: "FILTER", label: "Filtro / V60 / Chemex" },
                { value: "PRESS", label: "Prensa francesa" },
                { value: "ESPRESSO", label: "Espresso o máquina" },
                { value: "COLD", label: "Cold brew" },
              ]}
              picked={a.method}
              onPick={(v) => setA({ ...a, method: v as Method })}
            />
          )}

          {current === "form" && (
            <Question
              eyebrow="Pregunta 4"
              q="¿Grano entero o molido?"
              options={[
                { value: "WHOLE_BEAN", label: "En grano" },
                { value: "GROUND", label: "Molido" },
              ]}
              picked={a.form}
              onPick={(v) => setA({ ...a, form: v as Form })}
            />
          )}

          {current === "caffeine" && (
            <Question
              eyebrow="Pregunta 5"
              q="¿Cuánta cafeína buscas?"
              options={[
                { value: "FULL", label: "Completa" },
                { value: "MEDIUM", label: "Media" },
                { value: "DECAF", label: "Descafeinado" },
              ]}
              picked={a.caffeine}
              onPick={(v) => setA({ ...a, caffeine: v as Caffeine })}
            />
          )}

          <div className="flex items-center justify-between pt-6">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Atrás
            </Button>
            <Button onClick={next} disabled={!valid}>
              {step === TOTAL - 1 ? "Ver mi café" : "Siguiente →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isValid(step: Step, a: Answers): boolean {
  switch (step) {
    case "frequency":
      return a.frequency != null;
    case "flavors":
      return a.flavors.length > 0;
    case "method":
      return a.method != null;
    case "form":
      return a.form != null;
    case "caffeine":
      return a.caffeine != null;
  }
}

function Question({
  eyebrow,
  q,
  hint,
  options,
  picked,
  pickedMulti,
  onPick,
  onPickMulti,
  multi = false,
}: {
  eyebrow: string;
  q: string;
  hint?: string;
  options: { value: string; label: string }[];
  picked?: string | null;
  pickedMulti?: string[];
  onPick?: (v: string) => void;
  onPickMulti?: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
        {q}
      </h1>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="space-y-2.5 pt-2">
        {options.map((o) => {
          const isPicked = multi
            ? (pickedMulti ?? []).includes(o.value)
            : picked === o.value;
          return (
            <Choice
              key={o.value}
              picked={isPicked}
              big
              onClick={() => (multi ? onPickMulti?.(o.value) : onPick?.(o.value))}
            >
              {o.label}
            </Choice>
          );
        })}
      </div>
    </>
  );
}

function Result({ product, onReset }: { product: Product; onReset: () => void }) {
  const cheapest = product.variants.reduce(
    (a, b) => (a.priceOneTimeCents <= b.priceOneTimeCents ? a : b),
    product.variants[0],
  );
  const typeLabel: Record<ProductType, string> = {
    BLEND: "Mezcla",
    SINGLE_ORIGIN: "Origen único",
    DECAF: "Descafeinado",
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center bg-background">
      <div className="w-full max-w-3xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <span className="size-14 rounded-full bg-foreground text-background grid place-items-center mx-auto mb-4">
            <Coffee className="size-6" strokeWidth={1.5} />
          </span>
          <Eyebrow>Tu café ideal</Eyebrow>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="outline" className="font-normal uppercase tracking-[0.12em]">
              {typeLabel[product.type]}
            </Badge>
            {product.origin && <span className="text-xs text-muted-foreground">{product.origin}</span>}
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-6 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-3">
            <Roast level={product.roastLevel} />
            <div className="flex flex-wrap gap-1.5">
              {product.flavorNotes.map((n) => (
                <Badge key={n} variant="outline" className="font-normal">
                  {n}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div>
              <span className="block text-xs text-muted-foreground text-right">Desde</span>
              <span className="font-display text-2xl font-semibold tabular-nums">
                {formatCop(cheapest.priceOneTimeCents)}
              </span>
              {cheapest.priceSubscriptionCents != null && (
                <span className="block text-xs text-muted-foreground text-right">
                  o {formatCop(cheapest.priceSubscriptionCents)} suscripción
                </span>
              )}
            </div>
            <Button
              size="lg"
              render={<Link href={`/p/${product.slug}`}>Comprar este café</Link>}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={onReset}>
            ↺ Rehacer el quiz
          </Button>
          <Button
            variant="ghost"
            render={<Link href="/catalogo">Ver todo el catálogo</Link>}
          />
        </div>
      </div>
    </div>
  );
}
