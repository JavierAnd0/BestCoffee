"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { impersonateTenantAction } from "@/lib/actions/platform";

export function ImpersonateButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleImpersonate() {
    setError(null);
    startTransition(async () => {
      const result = await impersonateTenantAction(tenantId);
      if (result.ok) {
        // Otro dominio (el de la tienda): navegación completa, no del router.
        window.location.assign(result.url);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleImpersonate} disabled={isPending}>
        {isPending ? "Accediendo…" : `Entrar como admin de ${tenantName}`}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
