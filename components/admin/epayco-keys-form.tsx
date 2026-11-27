"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { disconnectEpaycoAction, saveEpaycoKeysAction } from "@/lib/actions/epayco";
import type { AdminMutationResult } from "@/lib/actions/admin-mutations";
import type { EpaycoStatus } from "@/lib/data/admin";

/**
 * ePayco no tiene OAuth: el dueño copia sus llaves del panel de ePayco
 * (Configuración → Personalizaciones → Llaves secretas). Las secretas no se
 * vuelven a mostrar; para cambiarlas se pegan todas de nuevo.
 */
export function EpaycoKeysForm({ status }: { status: EpaycoStatus | null }) {
  const [state, dispatch, saving] = useActionState<AdminMutationResult | null, FormData>(
    saveEpaycoKeysAction,
    null,
  );
  const [disconnecting, startDisconnect] = useTransition();
  const [disconnectResult, setDisconnectResult] = useState<AdminMutationResult | null>(null);
  const connected = status?.connected === true;
  const [editing, setEditing] = useState(!connected);
  const result = disconnectResult ?? state;

  const handleDisconnect = () => {
    if (!window.confirm("¿Desconectar ePayco? Tu tienda dejará de cobrar en línea con ePayco.")) {
      return;
    }
    startDisconnect(async () => {
      const res = await disconnectEpaycoAction();
      setDisconnectResult(res);
      if (res.ok) setEditing(true);
    });
  };

  return (
    <div className="space-y-4">
      {connected && status && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="size-4" />
            ePayco conectado · Customer ID {status.customerId}
          </span>
          {status.test && <Badge variant="outline">Modo de pruebas</Badge>}
          {!status.active && (
            <span className="text-xs text-muted-foreground">
              (otra pasarela está activa; guarda las llaves de nuevo para usar ePayco)
            </span>
          )}
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
        <form
          action={(fd) => {
            setDisconnectResult(null);
            dispatch(fd);
          }}
          className="space-y-4"
        >
          <p className="text-xs text-muted-foreground">
            Cópialas de tu panel de ePayco en Configuración → Personalizaciones → Llaves secretas.
            Las probamos con ePayco antes de guardarlas y las guardamos cifradas.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <KeyField name="customerId" label="P_CUST_ID_CLIENTE" defaultValue={status?.customerId ?? ""} />
            <KeyField name="pKey" label="P_KEY" secret />
            <KeyField name="publicKey" label="Llave pública (PUBLIC_KEY)" defaultValue={status?.publicKey ?? ""} />
            <KeyField name="privateKey" label="Llave privada (PRIVATE_KEY)" secret />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="test"
              defaultChecked={status?.test ?? true}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              Modo de pruebas
              <span className="block text-xs text-muted-foreground">
                Usa las tarjetas de prueba de ePayco; no se cobra dinero real. Desmárcalo para
                empezar a vender.
              </span>
            </span>
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {saving ? "Probando llaves…" : connected ? "Guardar llaves" : "Conectar ePayco"}
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
            Cambiar llaves
          </Button>
          <Button variant="ghost" size="sm" disabled={disconnecting} onClick={handleDisconnect}>
            {disconnecting && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Desconectar
          </Button>
        </div>
      )}
    </div>
  );
}

function KeyField({
  name,
  label,
  defaultValue = "",
  secret,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  secret?: boolean;
}) {
  return (
    <label className="block">
      <span className="block admin-label mb-1.5">
        {label}
      </span>
      <input
        name={name}
        type={secret ? "password" : "text"}
        required
        autoComplete="off"
        spellCheck={false}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}
