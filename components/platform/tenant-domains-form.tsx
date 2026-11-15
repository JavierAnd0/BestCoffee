"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addTenantDomainAction,
  removeTenantDomainAction,
  verifyTenantDomainAction,
  type DomainVerification,
} from "@/lib/actions/platform";

interface Domain {
  id: string;
  domain: string;
  isPrimary: boolean;
  verified: boolean;
}

/**
 * Dominios propios de la tienda. Un dominio solo enruta a la tienda cuando está
 * VERIFICADO: el dueño publica un registro TXT en su DNS y aquí se comprueba.
 */
export function TenantDomainsForm({
  tenantId,
  domains,
  enabled,
}: {
  tenantId: string;
  domains: Domain[];
  /** El plan de la tienda incluye dominio propio. */
  enabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, DomainVerification>>({});

  function run(action: () => Promise<Awaited<ReturnType<typeof addTenantDomainAction>>>, id?: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.verification && id) setInstructions((i) => ({ ...i, [id]: res.verification! }));
      if (res.verification && !id) setInstructions((i) => ({ ...i, [res.domain ?? ""]: res.verification! }));
      if (res.verified === false && res.reason) setMessage(res.reason);
      if (res.verified) setMessage("Dominio verificado: ya sirve esta tienda.");
      setValue("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!enabled && (
        <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
          El plan actual no incluye dominio propio (activa «Dominio propio» en Plan y capacidades).
        </p>
      )}

      {domains.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin dominios configurados</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {domains.map((d) => {
            const info = instructions[d.id] ?? instructions[d.domain];
            return (
              <li key={d.id} className="px-3 py-2.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{d.domain}</span>
                  {d.isPrimary && <Badge variant="outline">Principal</Badge>}
                  {d.verified ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Verificado</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-border">Pendiente</Badge>
                  )}
                  <span className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => run(() => verifyTenantDomainAction(tenantId, d.id), d.id)}
                    >
                      Verificar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => run(() => removeTenantDomainAction(tenantId, d.id))}
                    >
                      Quitar
                    </Button>
                  </span>
                </div>
                {!d.verified && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Para verificarlo, el dueño del dominio debe crear este registro en su DNS:</p>
                    <p className="font-mono break-all">
                      {info
                        ? `TXT  ${info.host}  =  ${info.value}`
                        : `Pulsa «Verificar» para ver el registro TXT a publicar en _bestcoffee.${d.domain}`}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) run(() => addTenantDomainAction(tenantId, value.trim()));
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="tienda.cafe-roma.com"
          aria-label="Nuevo dominio"
          disabled={!enabled}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50 disabled:opacity-50"
        />
        <Button type="submit" disabled={isPending || !enabled || !value.trim()}>
          Añadir dominio
        </Button>
      </form>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
