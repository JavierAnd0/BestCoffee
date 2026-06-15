"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import {
  verifyOperatorMagicLink,
  type VerifyState,
} from "@/lib/actions/operator-auth";

export function VerifyForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, dispatch, isPending] = useActionState<VerifyState, FormData>(
    verifyOperatorMagicLink,
    null,
  );

  const missing = !token || !email;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo size={18} href="/" />
        </div>

        <div className="rounded-xl border border-line bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent/10">
            <ShieldCheck className="size-6 text-accent" />
          </div>

          {missing ? (
            <>
              <h1 className="font-display text-xl font-semibold tracking-tight">
                Enlace incompleto
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                El enlace de acceso no es válido. Solicita uno nuevo.
              </p>
              <Link
                href="/acceso"
                className="mt-6 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/85 transition-all"
              >
                Volver a solicitar acceso
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold tracking-tight">
                Confirma tu acceso
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vas a entrar como <span className="font-medium text-foreground">{email}</span>.
              </p>

              {state && "error" in state && (
                <div className="mt-5 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {state.error}
                  <Link
                    href="/acceso"
                    className="mt-2 block font-medium underline underline-offset-2"
                  >
                    Solicitar un enlace nuevo
                  </Link>
                </div>
              )}

              <form action={dispatch} className="mt-6">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="email" value={email} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {!isPending && <ArrowRight className="size-4" />}
                  {isPending ? "Entrando…" : "Acceder al panel"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
