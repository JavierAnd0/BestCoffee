"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import {
  requestPasswordResetAction,
  type PasswordResetState,
} from "@/lib/actions/auth";

export default function RecuperarPasswordPage() {
  const [state, dispatch, isPending] = useActionState<PasswordResetState, FormData>(
    requestPasswordResetAction,
    null,
  );

  const isSent = state != null && "sent" in state;

  return (
    <div className="min-h-screen grid lg:grid-cols-[5fr_7fr]">
      <aside
        className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "var(--cream-dark)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage: "var(--grain)",
            backgroundRepeat: "repeat",
            backgroundSize: "200px",
          }}
        />
        <Logo size={18} href="/" className="relative z-10" />
        <div className="relative z-10 space-y-6">
          <p
            className="font-display italic font-light leading-[1.18] tracking-[-0.02em]"
            style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)" }}
          >
            “Tu cuenta y tus suscripciones están seguras. Recupera el acceso en segundos.”
          </p>
        </div>
        <p className="relative z-10 text-xs tracking-[0.16em] uppercase text-muted-foreground font-medium">
          Café de especialidad · Bogotá, Colombia
        </p>
      </aside>

      <main className="flex flex-col px-6 py-10 sm:px-12 lg:px-20">
        <div className="flex items-center justify-between mb-10 lg:mb-0">
          <Logo size={18} href="/" className="lg:hidden" />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            <ArrowLeft className="size-3.5" />
            Volver a iniciar sesión
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          {isSent ? (
            <div className="text-center space-y-5 py-8">
              <span className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center mx-auto">
                <Check className="size-6 text-emerald-700" strokeWidth={2} />
              </span>
              <div>
                <h1
                  className="font-display font-semibold tracking-tight"
                  style={{ fontSize: "1.75rem" }}
                >
                  Revisa tu correo
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Si el correo está asociado a una cuenta activa, recibirás un enlace con las instrucciones para restablecer tu contraseña.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-accent text-accent-foreground px-6 text-sm font-medium transition-all hover:bg-accent/85"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <p className="eyebrow mb-3">Recuperación de acceso</p>
                <h1
                  className="font-display font-semibold tracking-tight"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}
                >
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecerla.
                </p>
              </header>

              {state != null && "error" in state && (
                <div className="mb-6 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {state.error}
                </div>
              )}

              <form action={dispatch} className="space-y-5" noValidate>
                <label className="block">
                  <span className="eyebrow block mb-2">Correo electrónico</span>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="tu@correo.com"
                      className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 pl-9 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
                    />
                    <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? "Enviando instrucciones…" : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

