"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import { verifyOperatorMfaAction, type MfaVerifyState } from "@/lib/actions/operator-auth";

export function MfaForm({ pending }: { pending: boolean }) {
  const [state, dispatch, isPending] = useActionState<MfaVerifyState, FormData>(
    verifyOperatorMfaAction,
    null,
  );
  const [useRecovery, setUseRecovery] = useState(false);
  const expired = !pending || (state && "expired" in state && state.expired);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo size={18} href="/" />
        </div>

        <div className="rounded-xl border border-line bg-card p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent/10">
            <KeyRound className="size-6 text-accent" aria-hidden />
          </div>

          {expired ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold tracking-tight">
                Tu acceso expiró
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Por seguridad, el paso de verificación dura 5 minutos. Pide un enlace nuevo.
              </p>
              <Link
                href="/acceso"
                className="mt-6 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/85 transition-all"
              >
                Pedir un enlace nuevo
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center font-display text-xl font-semibold tracking-tight">
                Verificación en dos pasos
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {useRecovery
                  ? "Escribe uno de tus códigos de respaldo. Cada uno sirve una sola vez."
                  : "Abre tu app de autenticación y escribe el código de 6 dígitos."}
              </p>

              {state && "error" in state && (
                <div
                  role="alert"
                  className="mt-5 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {state.error}
                </div>
              )}

              <form action={dispatch} className="mt-6 space-y-4">
                <label className="block">
                  <span className="sr-only">
                    {useRecovery ? "Código de respaldo" : "Código de verificación"}
                  </span>
                  {useRecovery ? (
                    <input
                      key="recovery"
                      name="code"
                      required
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="abcd-efgh"
                      className="w-full h-12 rounded-lg border border-input bg-background px-4 text-center font-mono text-lg tracking-widest"
                    />
                  ) : (
                    <input
                      key="totp"
                      name="code"
                      required
                      autoFocus
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9 ]{6,7}"
                      maxLength={7}
                      placeholder="123 456"
                      className="w-full h-12 rounded-lg border border-input bg-background px-4 text-center font-mono text-2xl tracking-[0.3em] tabular-nums"
                    />
                  )}
                </label>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ArrowRight className="size-4" aria-hidden />
                  )}
                  {isPending ? "Verificando…" : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setUseRecovery((v) => !v)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {useRecovery ? "Usar el código de la app" : "No tengo mi teléfono: usar un código de respaldo"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
