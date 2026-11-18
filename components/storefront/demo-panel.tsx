"use client";

import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { setDemoFeaturesAction } from "@/lib/actions/demo";
import {
  DEMO_FEATURES,
  DEMO_GROUPS,
  DEMO_PRESETS,
  FEATURE_LABEL,
  changeNote,
  contactHref,
  matchPreset,
  seeHref,
  summarize,
  toggleFeature,
  type DemoKey,
  type DemoState,
} from "@/lib/demo-plan";
import type { TenantFeatures } from "@/lib/types";
import { Tooltip } from "@/components/ui/tooltip";

interface Note {
  key: DemoKey;
  text: string;
  /** Estado anterior, para "Deshacer". */
  undo: DemoState;
  /** A dónde lleva "Ver el sitio". */
  href: string;
}

/**
 * Barra de la tienda demo. Plegada es una barra mínima con el resumen de lo
 * armado ("Plan Tienda · 8 de 8") y los dos pasos que importan: ajustar y pedir
 * la tienda; la home ocupa la pantalla. "Ajustar" despliega encima las funciones
 * para encender y apagar. El estado es solo del visitante (cookie de 1 día) y la
 * demo nunca cobra: no hay pagos en línea.
 *
 * Móvil primero: ocupa el ancho disponible y se apoya sobre la barra de
 * navegación; desde `lg` se ancla abajo a la derecha como tarjeta.
 */
export function DemoPanel({
  features,
  contactEmail = null,
}: {
  features: TenantFeatures;
  /** Correo ya validado en el servidor; sin él no se muestra el botón de contacto. */
  contactEmail?: string | null;
}) {
  const router = useRouter();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Aviso del último cambio: bajo la fila tocada, hasta el siguiente cambio.
  const [note, setNote] = useState<Note | null>(null);
  const [flash, setFlash] = useState<DemoKey[]>([]);
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState<string | null>(null);
  // "Ver el sitio": si el cambio aún se está aplicando, navegar al terminar.
  const gotoRef = useRef<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const fromServer = Object.fromEntries(DEMO_FEATURES.map((f) => [f.key, features[f.key]])) as DemoState;
  // Lo que ve el visitante cambia al instante y se acumula si toca varias veces
  // seguidas; si el servidor falla, vuelve solo al estado real.
  const [current, setCurrent] = useOptimistic(fromServer, (_: DemoState, next: DemoState) => next);
  const summary = summarize(current);
  const activePreset = matchPreset(current);

  // El contenido se monta y desmonta: sin esto el foco caería al <body>.
  useEffect(() => {
    if (open) {
      titleRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      toggleRef.current?.focus();
    }
  }, [open]);

  // Escape pliega la barra aunque el foco esté en la página.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // El aviso se lleva a la vista y se queda hasta el siguiente cambio: así
  // "Deshacer" sigue ahí aunque el visitante tarde en leerlo.
  useEffect(() => {
    if (!note) return;
    document.getElementById(`${uid}-note`)?.scrollIntoView({ block: "nearest" });
  }, [note, uid]);

  // Que el punto de partida activo quede a la vista en la fila de móvil.
  useEffect(() => {
    const row = presetsRef.current;
    const chip = row?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (!row || !chip) return;
    row.scrollLeft += chip.getBoundingClientRect().left - row.getBoundingClientRect().left - 16;
  }, [open, activePreset]);

  function seeSite(href: string) {
    setOpen(false);
    if (isPending) gotoRef.current = href;
    else router.push(href);
  }

  function apply(state: DemoState | null, opts: { note?: Note | null; also?: DemoKey[] } = {}) {
    setNote(opts.note ?? null);
    setFlash(opts.also ?? []);
    setError(null);
    const next = state ? summarize(state) : null;
    setAnnounce(
      next
        ? `${opts.note ? opts.note.text + " " : ""}${next.title}. ${next.detail}`
        : "Demo restaurada.",
    );
    startTransition(async () => {
      if (state) setCurrent(state);
      const result = await setDemoFeaturesAction(state).catch(() => ({ ok: false }));
      if (!result.ok) {
        setError("No pudimos aplicar el cambio. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
      if (gotoRef.current) {
        router.push(gotoRef.current);
        gotoRef.current = null;
      }
    });
  }

  function flip(key: DemoKey, on: boolean) {
    const { state, also } = toggleFeature(current, key, on);
    apply(state, {
      note: { key, text: changeNote(key, on, also), undo: current, href: seeHref(key, on) },
      also,
    });
  }

  return (
    <div className="fixed z-50 inset-x-3 bottom-24 sm:inset-x-auto sm:left-4 lg:left-auto lg:right-6 lg:bottom-6">
      <section
        aria-label="Arma tu tienda"
        aria-busy={isPending}
        className={
          "flex w-full sm:w-[22rem] lg:w-[24rem] flex-col overflow-hidden short:overflow-y-auto rounded-lg border border-border bg-background shadow-xl " +
          (open
            ? "max-h-[72dvh] sm:max-h-[min(40rem,70dvh)] lg:max-h-[min(46rem,calc(100dvh-3rem))]"
            : "")
        }
      >
        {open && (
          <div
            id={`${uid}-content`}
            className="demo-panel-in flex min-h-0 flex-1 flex-col short:flex-none"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background pl-4 pr-1 short:sticky short:top-0 short:z-10">
              <h2
                id={`${uid}-title`}
                ref={titleRef}
                tabIndex={-1}
                className="font-display text-xl font-semibold leading-tight outline-none"
              >
                Arma tu tienda
              </h2>
              <Tooltip content="Cerrar Arma tu tienda">
                <button
                  type="button"
                  aria-label="Cerrar Arma tu tienda"
                  onClick={() => setOpen(false)}
                  className="grid size-11 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </Tooltip>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto short:flex-none short:overflow-visible overscroll-contain px-4 pb-6 pt-4">
              <p className="text-sm leading-snug text-foreground/70 text-pretty">
                Enciende lo que tu café necesita y mira cómo cambia el sitio. Es una demo: no cobra, y
                el precio se acuerda contigo según lo que armes.
              </p>

              <div
                ref={presetsRef}
                role="group"
                aria-label="Puntos de partida"
                className="no-scrollbar -mx-4 mt-3 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0"
              >
                {DEMO_PRESETS.map((p) => {
                  const active = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      title={p.help}
                      onClick={() => apply(p.state)}
                      className={
                        "flex min-h-11 shrink-0 snap-start flex-col justify-center rounded-md border px-3 py-2 text-left transition-colors " +
                        (active
                          ? "border-foreground bg-muted"
                          : "border-border hover:border-foreground/40")
                      }
                    >
                      <span className="block whitespace-nowrap text-sm font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {DEMO_GROUPS.map((group) => (
                <div
                  key={group.id}
                  role="group"
                  aria-labelledby={`${uid}-${group.id}`}
                  className="mt-5 sm:mt-6"
                >
                  <h3 id={`${uid}-${group.id}`} className="eyebrow text-foreground/70">
                    {group.title}
                  </h3>
                  <ul className="mt-1 divide-y divide-border">
                    {group.features.map(({ key, label, help, needs }) => {
                      const on = current[key];
                      return (
                        <li
                          key={key}
                          id={`${uid}-row-${key}`}
                          className={flash.includes(key) ? "demo-flash" : undefined}
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            aria-describedby={`${uid}-${key}`}
                            onClick={() => flip(key, !on)}
                            className="flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block text-base font-medium leading-snug">{label}</span>
                              <span
                                id={`${uid}-${key}`}
                                className="block text-sm leading-snug text-foreground/70"
                              >
                                {help}
                                {needs ? ` · Necesita ${FEATURE_LABEL[needs]}` : ""}
                              </span>
                            </span>
                            <span
                              aria-hidden
                              className={
                                "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors " +
                                (on ? "bg-foreground" : "bg-muted ring-1 ring-inset ring-foreground/55")
                              }
                            >
                              <span
                                className={
                                  "inline-block size-4 rounded-full transition-transform duration-200 ease-out " +
                                  (on ? "translate-x-5 bg-background" : "translate-x-1 bg-foreground/55")
                                }
                              />
                            </span>
                          </button>
                          {note?.key === key && (
                            <div
                              id={`${uid}-note`}
                              className="mb-3 rounded-md bg-muted px-3 py-2 text-sm leading-snug"
                            >
                              <p>{note.text}</p>
                              <div className="-mb-1 flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => apply(note.undo)}
                                  className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                                >
                                  Deshacer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => seeSite(note.href)}
                                  className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                                >
                                  Ver el sitio
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <p className="mt-6 text-sm leading-relaxed text-foreground/70 text-pretty">
                Pagos en línea, regalos y dominio propio existen, pero la demo no los simula.
              </p>
              <button
                type="button"
                onClick={() => apply(null)}
                className="mt-2 inline-flex min-h-11 items-center text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground"
              >
                Volver a la demo completa
              </button>
              {contactEmail && (
                <p className="mt-2 text-sm leading-snug text-foreground/70 sm:hidden">
                  ¿No se abre tu correo? Escríbenos a{" "}
                  <span className="select-all break-all font-medium text-foreground">{contactEmail}</span>.
                </p>
              )}
              {/* Pista de que hay más abajo: un velo que se apoya en el borde del área desplazable. */}
              <div
                aria-hidden
                className="pointer-events-none sticky -bottom-4 -mx-4 -mb-4 mt-2 h-4 bg-gradient-to-t from-background to-transparent short:hidden"
              />
            </div>
          </div>
        )}

        <footer className={"shrink-0 bg-muted/60 px-4 py-3 " + (open ? "border-t border-border" : "")}>
          {/* Anuncio para lectores de pantalla: cambio de plan y avisos de dependencia. */}
          <p role="status" className="sr-only">
            {announce}
          </p>
          {error && (
            <p role="alert" className="text-sm font-medium leading-snug text-destructive">
              {error}
            </p>
          )}
          {!open && <p className="eyebrow text-foreground/70">Arma tu tienda · por BestCoffee</p>}
          <div className={"flex items-baseline justify-between gap-3 " + (open ? "" : "mt-1")}>
            <p
              key={summary.level}
              className="demo-stamp font-display text-xl font-semibold leading-tight text-balance"
            >
              {summary.title}
            </p>
            <p className="eyebrow shrink-0 tabular-nums text-foreground/70">
              {isPending ? "Actualizando…" : `${summary.on} de ${summary.total} encendidas`}
            </p>
          </div>
          {open && (
            <p
              key={`${summary.level}-detail`}
              className="demo-stamp mt-0.5 hidden text-sm leading-snug text-foreground/70 text-pretty sm:block"
            >
              {summary.detail}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls={open ? `${uid}-content` : undefined}
              onClick={() => setOpen((v) => !v)}
              className={
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-foreground/35 px-4 text-sm font-medium hover:border-foreground " +
                (contactEmail ? "" : "flex-1")
              }
            >
              {open ? <X className="size-4" aria-hidden /> : <SlidersHorizontal className="size-4" aria-hidden />}
              {open ? "Cerrar" : "Ajustar"}
            </button>
            {contactEmail && (
              <a
                href={contactHref(contactEmail, current)}
                className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-80 active:translate-y-px"
              >
                Quiero esta tienda
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </a>
            )}
          </div>
          {open && contactEmail && (
            <p className="mt-2 hidden text-sm leading-snug text-foreground/70 sm:block">
              ¿No se abre tu correo? Escríbenos a{" "}
              <span className="select-all break-all font-medium text-foreground">{contactEmail}</span>.
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}
