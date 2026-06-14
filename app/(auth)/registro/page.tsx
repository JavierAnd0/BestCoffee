"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, Check } from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import { registerAction, type RegisterState } from "@/lib/actions/auth";

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /\d/.test(p) },
];

export default function RegistroPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [state, dispatch, isPending] = useActionState<RegisterState, FormData>(
    registerAction,
    null,
  );

  const isSuccess = state != null && "success" in state;
  const errorMsg = state != null && "error" in state ? state.error : null;
  const pwdStrength = PASSWORD_RULES.filter((r) => r.test(pwd)).length;

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

        <div className="relative z-10 space-y-10">
          {/* Benefit list */}
          <div className="space-y-5">
            {[
              { title: "Envíos con descuento", body: "15% de ahorro en cada entrega con tu suscripción activa." },
              { title: "Historial de pedidos", body: "Revisa, reordena y gestiona tus compras desde un solo lugar." },
              { title: "Suscripciones flexibles", body: "Pausa, cambia o cancela cuando quieras. Sin compromisos." },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="size-5 rounded-full bg-foreground/10 grid place-items-center shrink-0 mt-0.5">
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pull stat */}
          <div className="border-t border-foreground/10 pt-8">
            <p className="font-display italic font-light leading-tight" style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)" }}>
              "+3.200 suscriptores ya reciben su café fresco cada mes."
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-[0.16em] uppercase text-muted-foreground font-medium">
          Café de especialidad · Bogotá, Colombia
        </p>
      </aside>

      {/* ── Panel derecho: formulario ── */}
      <main className="flex flex-col px-6 py-10 sm:px-12 lg:px-20">

        {/* Nav top */}
        <div className="flex items-center justify-between mb-10 lg:mb-0">
          <Logo size={18} href="/" className="lg:hidden" />
          <Link
            href="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            <ArrowLeft className="size-3.5" />
            Volver a la tienda
          </Link>
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Tienda
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">

          {isSuccess ? (
            /* ── Estado: cuenta creada ── */
            <div className="text-center space-y-5 py-12">
              <span className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center mx-auto">
                <Check className="size-6 text-emerald-700" strokeWidth={2} />
              </span>
              <div>
                <h1 className="font-display font-semibold tracking-tight" style={{ fontSize: "1.75rem" }}>
                  ¡Bienvenido a ORÍGEN!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {"message" in state ? state.message : "Revisa tu correo para verificar tu dirección."}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-accent text-accent-foreground px-6 text-sm font-medium transition-all hover:bg-accent/85"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <header className="mb-8">
                <p className="eyebrow mb-3">Nueva cuenta</p>
                <h1 className="font-display font-semibold tracking-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
                  Crea tu cuenta
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gratis. Sin tarjeta de crédito. Listo en 30 segundos.
                </p>
              </header>

              {errorMsg && (
                <div className="mb-5 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMsg}
                </div>
              )}

              <form action={dispatch} className="space-y-4" noValidate>

                {/* Nombre */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="eyebrow block mb-2">Nombre</span>
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="María"
                      className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow block mb-2">Apellido</span>
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="Restrepo"
                      className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"
                    />
                  </label>
                </div>

                {/* Email */}
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

                {/* Contraseña */}
                <div>
                  <label className="block">
                    <span className="eyebrow block mb-2">Contraseña</span>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        name="password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
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

                  {/* Strength meter */}
                  {pwd.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors duration-300"
                            style={{
                              background: i < pwdStrength
                                ? pwdStrength === 1 ? "#ef4444"
                                  : pwdStrength === 2 ? "#f59e0b"
                                  : "#22c55e"
                                : "var(--muted)",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {PASSWORD_RULES.map((r) => (
                          <span
                            key={r.label}
                            className="flex items-center gap-1 text-[10px] transition-colors"
                            style={{ color: r.test(pwd) ? "#16a34a" : "var(--muted-foreground)" }}
                          >
                            <Check className="size-2.5" strokeWidth={2.5} />
                            {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    name="terms"
                    className="size-4 mt-0.5 rounded border-input accent-foreground cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    Acepto los{" "}
                    <Link href="/legal/terminos" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                      Términos de uso
                    </Link>{" "}
                    y la{" "}
                    <Link href="/legal/privacidad" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                      Política de privacidad
                    </Link>
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:bg-accent/85 active:translate-y-px disabled:opacity-70 disabled:pointer-events-none mt-1"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? "Creando cuenta…" : "Crear cuenta"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 flex items-center gap-3">
                <span className="flex-1 h-px bg-line" />
                <span className="text-[11px] text-muted-foreground tracking-[0.12em] uppercase font-medium">
                  o regístrate con
                </span>
                <span className="flex-1 h-px bg-line" />
              </div>

              {/* Google OAuth */}
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

              {/* Login link */}
              <p className="mt-7 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-2">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer legal */}
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
