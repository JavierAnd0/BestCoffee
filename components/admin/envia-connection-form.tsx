"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColombiaLocationSelector } from "@/components/storefront/colombia-location-selector";
import {
  disconnectEnviaAction,
  saveEnviaConnectionAction,
} from "@/lib/actions/shipping";
import type { AdminMutationResult } from "@/lib/actions/admin-mutations";
import type { EnviaStatus } from "@/lib/data/shipping";

const DEFAULT_PACKAGE = { lengthCm: 20, widthCm: 15, heightCm: 10, packagingGrams: 150 };

/**
 * Cuenta de Envia.com de la tienda. Cada tienda usa la suya: las guías se
 * pagan con su saldo de Envia. El token se prueba antes de guardarlo y se
 * guarda cifrado; no se vuelve a mostrar.
 */
export function EnviaConnectionForm({ status }: { status: EnviaStatus | null }) {
  const connected = status?.connected === true;
  const [editing, setEditing] = useState(!connected);
  const [result, setResult] = useState<AdminMutationResult | null>(null);
  const [pending, startTransition] = useTransition();

  const origin = status?.origin;
  const pkg = status?.package ?? DEFAULT_PACKAGE;
  const [state, setState] = useState(origin?.state ?? "");
  const [city, setCity] = useState(origin?.city ?? "");

  const submit = (fd: FormData) => {
    const text = (k: string) => String(fd.get(k) ?? "").trim();
    const int = (k: string) => Number.parseInt(text(k), 10);
    setResult(null);
    startTransition(async () => {
      const res = await saveEnviaConnectionAction({
        token: text("token") || undefined,
        webhookSecret: text("webhookSecret") || undefined,
        test: fd.get("test") === "on",
        origin: {
          name: text("name"),
          company: text("company"),
          phone: text("phone"),
          email: text("email"),
          street: text("street"),
          reference: text("reference"),
          city,
          state,
          identificationNumber: text("identificationNumber"),
        },
        package: {
          lengthCm: int("lengthCm"),
          widthCm: int("widthCm"),
          heightCm: int("heightCm"),
          packagingGrams: int("packagingGrams"),
        },
      });
      setResult(res);
      if (res.ok) setEditing(false);
    });
  };

  const handleDisconnect = () => {
    if (!window.confirm("¿Desconectar Envia? Las guías ya generadas siguen su curso, pero no podrás crear nuevas.")) {
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await disconnectEnviaAction();
      setResult(res);
      if (res.ok) setEditing(true);
    });
  };

  return (
    <div className="space-y-4">
      {connected && status && (
        <div className="space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-4" />
              Envia conectado
            </span>
            {status.test && <Badge variant="outline">Modo de pruebas</Badge>}
          </div>
          {origin && (
            <p className="text-xs text-muted-foreground">
              Despacha desde {origin.street}, {origin.city} ({origin.state}) · Caja {pkg.lengthCm}×
              {pkg.widthCm}×{pkg.heightCm} cm
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {status.webhookRegistered
              ? "Envia avisa cada cambio de la guía y el pedido se actualiza solo."
              : "El estado de las guías se consulta a Envia cada 30 minutos."}
          </p>
        </div>
      )}

      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={"text-xs " + (result.ok ? "text-emerald-700" : "text-red-600")}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}

      {editing ? (
        <form action={submit} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-xs text-muted-foreground">
              Crea el token en tu panel de Envia: Desarrolladores → API Keys. El de pruebas y el de
              producción son distintos.
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                name="token"
                label={connected ? "Token de API (déjalo vacío para conservarlo)" : "Token de API"}
                secret
                required={!connected}
              />
              <Field
                name="webhookSecret"
                label="Secreto de webhooks (opcional)"
                secret
                hint="Solo si Envia te muestra uno; si no, la firma se verifica con el token."
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="test"
                defaultChecked={status?.test ?? true}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                Modo de pruebas (sandbox)
                <span className="block text-xs text-muted-foreground">
                  Las guías de prueba no se despachan ni cobran. Desmárcalo con un token de
                  producción para empezar a enviar.
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="admin-label">
              Desde dónde despachas
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="name" label="Remitente" defaultValue={origin?.name} required />
              <Field name="company" label="Empresa (opcional)" defaultValue={origin?.company} />
              <Field name="phone" label="Teléfono" defaultValue={origin?.phone} required />
              <Field name="email" label="Correo (opcional)" defaultValue={origin?.email} type="email" />
              <Field name="street" label="Dirección" defaultValue={origin?.street} required />
              <Field name="reference" label="Complemento (opcional)" defaultValue={origin?.reference} />
              <Field
                name="identificationNumber"
                label="NIT o cédula (opcional)"
                defaultValue={origin?.identificationNumber}
              />
            </div>
            <ColombiaLocationSelector
              variant="dialog"
              department={state}
              city={city}
              onDepartmentChange={setState}
              onCityChange={setCity}
              departmentId="envia-origin-department"
              cityId="envia-origin-city"
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="admin-label">
              Caja por defecto
            </legend>
            <p className="text-xs text-muted-foreground">
              El peso se calcula con los gramos de café del pedido más el empaque. Puedes ajustarlo
              en cada guía.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field name="lengthCm" label="Largo (cm)" defaultValue={String(pkg.lengthCm)} type="number" required />
              <Field name="widthCm" label="Ancho (cm)" defaultValue={String(pkg.widthCm)} type="number" required />
              <Field name="heightCm" label="Alto (cm)" defaultValue={String(pkg.heightCm)} type="number" required />
              <Field
                name="packagingGrams"
                label="Empaque (g)"
                defaultValue={String(pkg.packagingGrams)}
                type="number"
                required
              />
            </div>
          </fieldset>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {pending ? "Probando con Envia…" : connected ? "Guardar" : "Conectar Envia"}
            </Button>
            {connected && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={handleDisconnect}>
            {pending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Desconectar
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue = "",
  secret,
  required,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  secret?: boolean;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block admin-label mb-1.5">
        {label}
      </span>
      <input
        name={name}
        type={secret ? "password" : type}
        required={required}
        min={type === "number" ? 0 : undefined}
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
        className={
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40" +
          (secret ? " font-mono" : "")
        }
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
