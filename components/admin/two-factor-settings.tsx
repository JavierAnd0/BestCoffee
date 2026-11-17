"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disableMfaAction,
  enableMfaAction,
  regenerateRecoveryCodesAction,
  startMfaSetupAction,
  type MfaStatus,
} from "@/lib/actions/operator-mfa";

type View =
  | { kind: "idle" }
  | { kind: "setup"; secret: string; qrDataUrl: string }
  | { kind: "codes"; codes: string[] }
  | { kind: "confirm"; action: "disable" | "regenerate" };

/**
 * Verificación en dos pasos del operador: activarla con una app de
 * autenticación (QR o clave), guardar los códigos de respaldo, regenerarlos o
 * desactivarla. Las acciones sensibles piden un código vigente.
 */
export function TwoFactorSettings({ initial }: { initial: MfaStatus | null }) {
  const [status, setStatus] = useState<MfaStatus | null>(initial);
  const [view, setView] = useState<View>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!status) {
    return (
      <p className="text-sm text-muted-foreground">
        No pudimos cargar tu configuración de seguridad. Recarga la página.
      </p>
    );
  }

  function run<T>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, then: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setCode("");
      then(r.data);
    });
  }

  const codeInput = (label: string) => (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode={view.kind === "setup" ? "numeric" : undefined}
        autoComplete="one-time-code"
        autoFocus
        placeholder={view.kind === "setup" ? "123 456" : "123 456 o abcd-efgh"}
        className="mt-1.5 w-full max-w-60 rounded-md border border-input bg-background px-3 h-10 font-mono tracking-widest"
      />
    </label>
  );

  const errorBox = error && (
    <p role="alert" className="text-sm font-medium text-destructive">
      {error}
    </p>
  );

  // ── Códigos de respaldo recién generados (se muestran una sola vez) ────────
  if (view.kind === "codes") {
    const text = view.codes.join("\n");
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="font-medium">Guarda tus códigos de respaldo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si pierdes el teléfono, cada código te deja entrar una vez. No los volverás a ver:
              guárdalos en tu gestor de contraseñas o imprímelos.
            </p>
          </div>
        </div>
        <ul className="grid max-w-sm grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border border-border bg-muted/40 p-4 font-mono text-sm tabular-nums">
          {view.codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => setCopied(true));
            }}
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copiados" : "Copiar códigos"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCopied(false);
              setView({ kind: "idle" });
            }}
          >
            Ya los guardé
          </Button>
        </div>
      </div>
    );
  }

  // ── Activación: QR + primer código ─────────────────────────────────────────
  if (view.kind === "setup") {
    return (
      <div className="space-y-5">
        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
          <li>Abre tu app de autenticación (Google Authenticator, 1Password, Authy…).</li>
          <li>Escanea este código, o escribe la clave a mano.</li>
          <li>Escribe el código de 6 dígitos que te muestre la app.</li>
        </ol>
        <div className="flex flex-wrap items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el servidor */}
          <img
            src={view.qrDataUrl}
            width={208}
            height={208}
            alt="Código QR para tu app de autenticación"
            className="rounded-md border border-border"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Clave para escribir a mano</p>
            <p className="font-mono text-sm break-all select-all max-w-64">
              {view.secret.match(/.{1,4}/g)?.join(" ")}
            </p>
          </div>
        </div>
        {codeInput("Código de la app")}
        {errorBox}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isPending || code.replace(/\s/g, "").length !== 6}
            onClick={() =>
              run(
                () => enableMfaAction(code),
                (data) => {
                  setStatus({
                    enabled: true,
                    enabledAt: new Date().toISOString(),
                    recoveryCodesLeft: data.recoveryCodes.length,
                  });
                  setView({ kind: "codes", codes: data.recoveryCodes });
                },
              )
            }
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Activar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setError(null);
              setCode("");
              setView({ kind: "idle" });
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirmar desactivar o regenerar con un código vigente ────────────────
  if (view.kind === "confirm") {
    const disable = view.action === "disable";
    return (
      <div className="space-y-4">
        <p className="text-sm">
          {disable
            ? "Para desactivar la verificación en dos pasos, confirma con un código de tu app o uno de respaldo."
            : "Los códigos de respaldo actuales dejarán de servir. Confirma con un código de tu app o uno de respaldo."}
        </p>
        {codeInput("Código")}
        {errorBox}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={disable ? "destructive" : "default"}
            disabled={isPending || code.trim().length < 6}
            onClick={() =>
              disable
                ? run(
                    () => disableMfaAction(code),
                    () => {
                      setStatus({ enabled: false, enabledAt: null, recoveryCodesLeft: 0 });
                      setView({ kind: "idle" });
                    },
                  )
                : run(
                    () => regenerateRecoveryCodesAction(code),
                    (data) => {
                      setStatus((s) => (s ? { ...s, recoveryCodesLeft: data.recoveryCodes.length } : s));
                      setView({ kind: "codes", codes: data.recoveryCodes });
                    },
                  )
            }
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {disable ? "Desactivar" : "Generar códigos nuevos"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setError(null);
              setCode("");
              setView({ kind: "idle" });
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ── Estado ────────────────────────────────────────────────────────────────
  if (!status.enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">Desactivada</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-prose">
              Hoy entras solo con el enlace que llega a tu correo. Con la verificación en dos pasos,
              además te pediremos un código de tu teléfono: si alguien entra a tu correo, no le
              basta para entrar al panel.
            </p>
          </div>
        </div>
        {errorBox}
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => startMfaSetupAction(), (data) => setView({ kind: "setup", ...data }))}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
          Activar verificación en dos pasos
        </Button>
      </div>
    );
  }

  const since = status.enabledAt
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(status.enabledAt))
    : null;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
        <div>
          <p className="font-medium">Activa{since ? ` desde el ${since}` : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Te quedan {status.recoveryCodesLeft} de 10 códigos de respaldo.
            {status.recoveryCodesLeft <= 3 && " Genera códigos nuevos antes de quedarte sin ellos."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setView({ kind: "confirm", action: "regenerate" })}>
          Generar códigos de respaldo nuevos
        </Button>
        <Button variant="outline" size="sm" onClick={() => setView({ kind: "confirm", action: "disable" })}>
          Desactivar
        </Button>
      </div>
    </div>
  );
}
