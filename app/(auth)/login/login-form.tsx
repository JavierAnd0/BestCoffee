"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [showPwd, setShowPwd] = useState(false);
  const [state, dispatch, isPending] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_7fr]">

      {/* ── Panel izquierdo: brand ── */}
      <aside
        className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "var(--cream-dark)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{ backgroundImage: "var(--grain)", backgroundRepeat: "repeat", backgroundSize: "200px" }}
        />
        <Logo size={18} href="/" className="relative z-10" />
        <div className="relative z-10 space-y-8">
          <blockquote>
            <p className="font-display italic font-light leading-[1.18] tracking-[-0.02em]" style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)" }}>
              "Tostamos en lotes&nbsp;pequeños para que cada grano llegue a tu taza en su mejor momento."
            </p>
          </blockquote>
          <div className="flex items-center gap-4">
            <span className="block w-8 h-px bg-foreground/30" />
            <div>
              <div className="text-sm font-medium">Cooperativa Banko Dhadhato</div>
              <div className="text-xs text-muted-foreground">Guji, Etiopía · 1.950 msnm</div>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs tracking-[0.16em] uppercase text-muted-foreground font-medium">
          Café de especialidad · Bogotá, Colombia
        </p>
      </aside>

      {/* ── Panel derecho: form ── */}
      <main className="flex flex-col px-6 py-10 sm:px-12 lg:px-20">

        <div className="flex items-center justify-between mb-10 lg:mb-0">
          <Logo size={18} href="/" className="lg:hidden" />
          <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide">
            <ArrowLeft className="size-3.5" />
            Volver a la tienda
          </Link>
          <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" />
            Tienda
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">

          <header className="mb-9">
            <p className="eyebrow mb-3">Acceso a tu cuenta</p>
            <h1 className="font-display font-semibold tracking-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede a tus pedidos, suscripciones y preferencias.
            </p>
          </header>

          {state?.error && (
            <div className="mb-6 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.error}
            </div>
          )}

          <form action={dispatch} className="space-y-5" noValidate>
            <label className="block">
              <span className="eyebrow block mb-2">Correo electrónico</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="tu@correo.com"
                className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="eyebrow">Contraseña</span>
                <Link href="/login/recuperar" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors tracking-wide">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="size-4 rounded border-input accent-foreground cursor-pointer" />
              <span className="text-sm text-muted-foreground">Mantenerme conectado</span>
            </label>

            {/* next drives redirect AND which auth endpoint to use */}
            <input type="hidden" name="next" value={next} />

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Verificando…" : "Iniciar sesión"}
            </button>
          </form>

          <div className="relative my-7 flex items-center gap-3">
            <span className="flex-1 h-px bg-line" />
            <span className="text-[11px] text-muted-foreground tracking-[0.12em] uppercase font-medium">o continúa con</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <button
            type="button"
            disabled
            title="OAuth llega en Fase 3"
            className="w-full inline-flex items-center justify-center gap-2.5 h-10 rounded-lg border border-input bg-background text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-2">
              Regístrate gratis
            </Link>
          </p>

        </div>

        <footer className="mt-10 text-center text-[11px] text-muted-foreground/50 space-x-3">
          <Link href="/legal/privacidad" className="hover:text-muted-foreground transition-colors">Privacidad</Link>
          <span>·</span>
          <Link href="/legal/terminos" className="hover:text-muted-foreground transition-colors">Términos</Link>
          <span>·</span>
          <span>© 2026 ORÍGEN</span>
        </footer>
      </main>
    </div>
  );
}
