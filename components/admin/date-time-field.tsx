"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Selector de fecha y hora del panel, en español y con el estilo del admin
 * (reemplaza al `datetime-local` nativo, que sale en inglés y según el
 * navegador). El valor es ISO 8601 con zona (`toISOString`): el servidor lo
 * guarda tal cual, sin reinterpretar la hora en su propia zona horaria.
 */

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const pad = (n: number) => String(n).padStart(2, "0");
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function hourLabel(h: number): string {
  const suffix = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

/** "26 nov 2026 · 9:00 a. m." */
export function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const h = d.getHours();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())} ${h < 12 ? "a. m." : "p. m."}`;
  return `${date} · ${time}`;
}

/** Las 6 semanas (lunes a domingo) que muestran el mes de `month`. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function DateTimeField({
  label,
  name,
  value: controlled,
  defaultValue,
  onChange,
  min,
  defaultTime = "00:00",
  placeholder = "Sin fecha",
  hint,
}: {
  label: string;
  /** Con `name`, el valor viaja en un input oculto (formularios de acción). */
  name?: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (iso: string) => void;
  /** Días anteriores a esta fecha no se pueden elegir. */
  min?: string | null;
  /** Hora con la que se crea la fecha al elegir un día por primera vez ("HH:mm"). */
  defaultTime?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const iso = controlled ?? internal;
  const selected = parse(iso);
  const minDay = useMemo(() => {
    const m = parse(min);
    return m ? startOfDay(m) : null;
  }, [min]);

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfDay(selected ?? new Date()));
  const [focusDay, setFocusDay] = useState<Date>(() => startOfDay(selected ?? new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const today = new Date();

  function commit(next: Date | null) {
    const v = next ? next.toISOString() : "";
    if (controlled === undefined) setInternal(v);
    onChange?.(v);
  }

  function pickDay(day: Date) {
    commit(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute));
    setFocusDay(startOfDay(day));
    if (day.getMonth() !== month.getMonth()) setMonth(startOfDay(day));
  }

  function setTime(h: number, m: number) {
    const base = selected ?? startOfDay(new Date());
    commit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m));
  }

  const disabledDay = (d: Date) => !!minDay && d < minDay;

  function moveFocus(days: number) {
    const next = addDays(focusDay, days);
    setFocusDay(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${next.toDateString()}"]`)?.focus();
    });
  }

  const monthTitle = month.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const days = monthGrid(month);
  const [defaultH, defaultM] = defaultTime.split(":").map(Number);
  const hour = selected?.getHours() ?? defaultH;
  const minute = selected?.getMinutes() ?? defaultM;
  // Cada 5 minutos, más el minuto actual si no cae en esa lista (p. ej. 23:59).
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b);

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  const presets: { label: string; day: Date }[] = [
    { label: "Hoy", day: startOfDay(today) },
    { label: "Mañana", day: addDays(startOfDay(today), 1) },
    { label: "En una semana", day: addDays(startOfDay(today), 7) },
  ];

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm tabular-nums outline-none focus-visible:border-foreground/40";

  return (
    <div>
      <span id={labelId} className="block admin-label mb-1.5">
        {label}
      </span>
      {name && <input type="hidden" name={name} value={iso} />}

      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            const anchor = startOfDay(selected ?? new Date());
            setMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
            setFocusDay(anchor);
          }
        }}
      >
        <div className="relative">
          <Popover.Trigger
            aria-labelledby={labelId}
            className={
              "flex h-[38px] w-full items-center gap-2 rounded-md border bg-background pl-3 pr-9 text-left text-sm outline-none transition-colors focus-visible:border-foreground/40 " +
              (open ? "border-foreground/40" : "border-input hover:border-foreground/30")
            }
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className={"truncate " + (selected ? "" : "text-muted-foreground")}>
              {selected ? formatDateTime(selected) : placeholder}
            </span>
          </Popover.Trigger>
          {selected && (
            <button
              type="button"
              onClick={() => commit(null)}
              aria-label={`Quitar ${label.toLowerCase()}`}
              className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-[70]">
            <Popover.Popup
              initialFocus={() =>
                gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]') ?? true
              }
              className="w-[19.5rem] origin-(--transform-origin) rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none transition-[opacity,scale] duration-100 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="font-display text-base font-semibold first-letter:uppercase">{monthTitle}</span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => shift(-1)}
                    aria-label="Mes anterior"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="Mes siguiente"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1">{w}</span>
                ))}
              </div>
              <div
                ref={gridRef}
                role="grid"
                aria-label={monthTitle}
                className="grid grid-cols-7 gap-y-0.5"
                onKeyDown={(e) => {
                  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
                  if (step) {
                    e.preventDefault();
                    moveFocus(step);
                  }
                }}
              >
                {days.map((d) => {
                  const inMonth = d.getMonth() === month.getMonth();
                  const isSelected = !!selected && sameDay(d, selected);
                  const isToday = sameDay(d, today);
                  const disabled = disabledDay(d);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      role="gridcell"
                      data-day={d.toDateString()}
                      tabIndex={sameDay(d, focusDay) ? 0 : -1}
                      disabled={disabled}
                      aria-selected={isSelected}
                      aria-label={d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                      onClick={() => pickDay(d)}
                      className={
                        "relative mx-auto grid size-9 place-items-center rounded-md text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:pointer-events-none disabled:opacity-25 " +
                        (isSelected
                          ? "bg-foreground font-medium text-background"
                          : inMonth
                            ? "hover:bg-muted"
                            : "text-muted-foreground/50 hover:bg-muted")
                      }
                    >
                      {d.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 size-1 rounded-full bg-foreground/60" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={disabledDay(p.day)}
                    onClick={() => pickDay(p.day)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Hora</span>
                <select
                  aria-label="Hora"
                  value={hour}
                  onChange={(e) => setTime(+e.target.value, minute)}
                  className={selectClass + " flex-1"}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
                <span className="text-muted-foreground">:</span>
                <select
                  aria-label="Minutos"
                  value={minute}
                  onChange={(e) => setTime(hour, +e.target.value)}
                  className={selectClass + " w-20"}
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>{pad(m)}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  disabled={!selected}
                  onClick={() => commit(null)}
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-0"
                >
                  Quitar fecha
                </button>
                <Popover.Close className="h-8 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90">
                  Listo
                </Popover.Close>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
