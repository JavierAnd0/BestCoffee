"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import { subscribeNewsletterAction } from "@/lib/actions/newsletter";
import type { TenantNewsletter } from "@/lib/types";

/**
 * Invitación discreta a suscribirse al boletín.
 *
 * Diseño poco invasivo:
 *  - NO es un modal: sin fondo oscuro, sin bloquear el scroll ni los clics.
 *  - Solo aparece tras interés real (≥45 % de scroll o 40 s en la página) y
 *    nunca en los primeros 8 s.
 *  - Una sola vez por sesión; si la descartan, no vuelve en 30 días.
 *  - Nunca en checkout, cuenta, login/registro, legales ni paneles.
 *  - El layout solo la monta para visitantes SIN sesión (quien tiene cuenta ya
 *    está suscrito y lo gestiona en "Mis datos").
 */

const MIN_DELAY_MS = 8_000;
const DWELL_MS = 40_000;
const SCROLL_RATIO = 0.45;
const DISMISS_DAYS = 30;
const BLOCKED_PREFIXES = [
  "/checkout",
  "/cuenta",
  "/login",
  "/registro",
  "/acceso",
  "/legal",
  "/admin",
  "/platform",
  "/api",
];

interface Props {
  brand: string;
  tenantSlug: string;
  welcomeOffer: TenantNewsletter["welcomeOffer"];
}

export function NewsletterPrompt({ brand, tenantSlug, welcomeOffer }: Props) {
  const pathname = usePathname();
  const storeKey = `${tenantSlug}:newsletter`;
  const sessionKey = `${tenantSlug}:newsletter:shown`;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<TenantNewsletter["welcomeOffer"] | "ok" | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const blocked = BLOCKED_PREFIXES.some((p) => pathname.startsWith(p));

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(storeKey, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {}
  }, [storeKey]);

  useEffect(() => {
    if (blocked || open) return;

    try {
      if (sessionStorage.getItem(sessionKey)) return;
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const s = JSON.parse(raw) as { subscribed?: boolean; dismissedAt?: number };
        if (s.subscribed) return;
        if (s.dismissedAt && Date.now() - s.dismissedAt < DISMISS_DAYS * 86_400_000) return;
      }
    } catch {
      // sin storage: igual la mostramos, pero con las mismas reglas de tiempo
    }

    const startedAt = Date.now();
    // Nunca se abre sobre el hero animado: espera a que el usuario lo haya dejado atrás.
    const heroInView = () => {
      const hero = document.querySelector("[data-hero-story]");
      if (!hero) return false;
      const r = hero.getBoundingClientRect();
      return r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1;
    };
    const show = () => {
      if (heroInView()) return false;
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {}
      setOpen(true);
      return true;
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const ratio = window.scrollY / scrollable;
      if (ratio >= SCROLL_RATIO && Date.now() - startedAt >= MIN_DELAY_MS) {
        if (show()) cleanup();
      }
    };

    // `cleanup` es una declaración (hoisted): se invoca siempre tras crear `timer`.
    const timer = setTimeout(() => {
      // si el hero sigue en pantalla, se queda escuchando el scroll y sale al pasarlo
      if (show()) cleanup();
      else window.addEventListener("scroll", onScroll, { passive: true });
    }, DWELL_MS);

    function cleanup() {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return cleanup;
  }, [blocked, open, pathname, sessionKey, storeKey]);

  // Esc cierra solo si el foco está dentro de la tarjeta (no secuestra la tecla).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cardRef.current?.contains(document.activeElement)) {
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await subscribeNewsletterAction({ email, source: "popup" });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    try {
      localStorage.setItem(storeKey, JSON.stringify({ subscribed: true }));
    } catch {}
    setDone(res.welcomeOffer ?? "ok");
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  if (blocked || !open) return null;

  return (
    <aside
      ref={cardRef}
      aria-label={`Boletín de ${brand}`}
      className="fixed z-40 bottom-24 inset-x-4 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:w-[22rem] rounded-xl border border-white/10 bg-[#14110f]/95 text-stone-100 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-2.5 right-2.5 size-7 rounded-full grid place-items-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="size-4" />
      </button>

      <div className="p-5 pr-10">
        {done === null ? (
          <>
            <h2 className="font-display text-lg font-semibold leading-snug">
              Únete a la comunidad de {brand}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-300/90">
              Novedades, guías de preparación y lanzamientos
              {welcomeOffer ? (
                <>
                  , y <strong className="text-stone-100">{welcomeOffer.label}</strong> en tu
                  primera compra.
                </>
              ) : (
                "."
              )}{" "}
              Sin spam; te das de baja cuando quieras.
            </p>

            <form onSubmit={onSubmit} className="mt-3.5 flex gap-2" noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="min-w-0 flex-1 rounded-md bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus-visible:ring-2 focus-visible:ring-[#b8895a]"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-md bg-[#8f6d45] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7b5c36] disabled:opacity-60"
              >
                {busy ? "Enviando…" : "Suscribirme"}
              </button>
            </form>

            {error && (
              <p id="newsletter-error" role="alert" className="mt-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
              <button
                type="button"
                onClick={dismiss}
                className="underline underline-offset-2 hover:text-stone-200"
              >
                Ahora no
              </button>
              <Link
                href="/legal/privacidad"
                className="underline underline-offset-2 hover:text-stone-200"
              >
                Política de privacidad
              </Link>
            </div>
          </>
        ) : (
          <div role="status" aria-live="polite">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                <Check className="size-4" />
              </span>
              <h2 className="font-display text-lg font-semibold">¡Gracias por suscribirte!</h2>
            </div>
            {done !== "ok" ? (
              <>
                <p className="mt-2 text-[13px] text-stone-300/90">
                  Usa este código en el pago para tener {done.label}:
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2">
                  <span className="font-mono text-sm font-semibold tracking-wider text-amber-300">
                    {done.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(done.code)}
                    className="inline-flex items-center gap-1 text-xs text-stone-300 hover:text-white"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-stone-300/90">
                Ya haces parte de la comunidad de {brand}.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 text-xs underline underline-offset-2 text-stone-400 hover:text-stone-200"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
