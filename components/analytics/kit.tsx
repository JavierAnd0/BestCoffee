import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock, OctagonAlert, TrendingDown, TrendingUp } from "lucide-react";
import { RANGE_PRESETS, type RangeParams } from "@/lib/data/analytics";
import { formatPct } from "./format";

// Piezas de servidor compartidas por las páginas de métricas de la tienda y de
// la plataforma. Todo el estado vive en la URL (?tab, ?range, ?from&to), así
// que cada vista es enlazable y no hace falta JavaScript para navegar.

type SP = Record<string, string | string[] | undefined>;

function withParams(base: string, sp: SP, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") p.set(k, v);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) p.delete(k);
    else p.set(k, v);
  }
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}

export function AnalyticsTabs({
  base,
  sp,
  tabs,
  active,
}: {
  base: string;
  sp: SP;
  tabs: { key: string; label: string }[];
  active: string;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Secciones">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={withParams(base, sp, { tab: t.key })}
          aria-current={t.key === active ? "page" : undefined}
          className={
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors " +
            (t.key === active
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground")
          }
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Selector de periodo: atajos + rango personalizado (formulario GET). */
export function RangeBar({ base, sp, range }: { base: string; sp: SP; range: RangeParams }) {
  const tab = typeof sp.tab === "string" ? sp.tab : undefined;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="inline-flex rounded-md border border-border bg-background p-0.5">
        {RANGE_PRESETS.map((p) => (
          <Link
            key={p.key}
            href={withParams(base, sp, { range: p.key, from: undefined, to: undefined })}
            aria-current={range.preset === p.key ? "true" : undefined}
            className={
              "rounded px-2.5 py-1 transition-colors " +
              (range.preset === p.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {p.label}
          </Link>
        ))}
      </div>
      <form action={base} className="inline-flex items-center gap-1.5">
        {tab && <input type="hidden" name="tab" value={tab} />}
        <label className="sr-only" htmlFor="range-from">Desde</label>
        <input
          id="range-from"
          type="date"
          name="from"
          defaultValue={range.from}
          required
          className="h-7 rounded-md border border-border bg-background px-2"
        />
        <span className="text-muted-foreground">a</span>
        <label className="sr-only" htmlFor="range-to">Hasta</label>
        <input
          id="range-to"
          type="date"
          name="to"
          defaultValue={range.to}
          required
          className="h-7 rounded-md border border-border bg-background px-2"
        />
        <button
          type="submit"
          className={
            "h-7 rounded-md border px-2.5 transition-colors " +
            (range.preset === "custom"
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-muted")
          }
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  change,
  invert = false,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Δ% frente al periodo anterior. */
  change?: number | null;
  /** true cuando subir es malo (p. ej. churn). */
  invert?: boolean;
}) {
  const good = change !== null && change !== undefined && (invert ? change <= 0 : change >= 0);
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl lg:text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{hint}</span>
        {change !== undefined && (
          <span
            className={
              "inline-flex items-center gap-0.5 font-medium tabular-nums " +
              (change === null || change === 0 ? "text-muted-foreground" : good ? "text-emerald-700" : "text-destructive")
            }
            title="Frente al periodo anterior"
          >
            {change !== null && change !== 0 &&
              (change > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />)}
            {change === null ? "sin base" : change === 0 ? "sin cambio" : `${change > 0 ? "+" : ""}${formatPct(change)}`}
          </span>
        )}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"rounded-lg border border-border bg-background p-6 " + className}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
      </header>
      {children}
    </section>
  );
}

/** Barras horizontales de un solo color para rankings (el largo es el valor). */
export function BarList({
  items,
  empty = "Sin datos en este periodo",
}: {
  items: { key?: string; label: string; value: number; display: string; sub?: string }[];
  empty?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i, idx) => (
        <li key={i.key ?? `${idx}-${i.label}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 tabular-nums font-medium">{i.display}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#2a78d6]"
              style={{ width: `${Math.max((i.value / max) * 100, 2)}%` }}
            />
          </div>
          {i.sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{i.sub}</div>}
        </li>
      ))}
    </ul>
  );
}

/** Estado reservado: siempre con ícono y texto, nunca solo color. */
export function StatusPill({ level, children }: { level: "ok" | "attention" | "risk"; children: React.ReactNode }) {
  const Icon = level === "ok" ? CheckCircle2 : level === "attention" ? AlertTriangle : OctagonAlert;
  const tone =
    level === "ok"
      ? "text-emerald-800 bg-emerald-500/10"
      : level === "attention"
        ? "text-amber-800 bg-amber-500/10"
        : "text-destructive bg-destructive/10";
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " + tone}>
      <Icon className="size-3" />
      {children}
    </span>
  );
}

export function LockedState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function LoadError({ status }: { status: number }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
      No se pudieron cargar las métricas{status ? ` (error ${status})` : ""}. Intenta de nuevo en unos minutos.
    </div>
  );
}
