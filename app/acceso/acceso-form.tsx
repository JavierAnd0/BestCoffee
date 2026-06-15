"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import {
  requestOperatorMagicLink,
  type MagicLinkState,
} from "@/lib/actions/operator-auth";

export function AccesoForm() {
  const [state, dispatch, isPending] = useActionState<MagicLinkState, FormData>(
    requestOperatorMagicLink,
    null,
  );

  const sent = state && "sent" in state && state.sent;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center justify-between">
          <Logo size={18} href="/" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Tienda
          </Link>
        </div>

        {sent ? (
          <div className="rounded-xl border border-line bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent/10">
              <MailCheck className="size-6 text-accent" />
            </div>
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Revisa tu correo
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Si tu correo corresponde a un operador, te enviamos un enlace de
              acceso. Vence en 15 minutos y solo puede usarse una vez.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="eyebrow mb-3">Panel de administración</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Accede a tu panel
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Te enviaremos un enlace de acceso a tu correo. Sin contraseñas.
              </p>
            </header>

            {state && "error" in state && (
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Enviando…" : "Enviar enlace de acceso"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
