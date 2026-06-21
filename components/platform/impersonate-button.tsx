"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { impersonateTenantAction } from "@/lib/actions/platform";

export function ImpersonateButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleImpersonate() {
    setError(null);
    startTransition(async () => {
      const result = await impersonateTenantAction(tenantId);
      if (result.ok) {
        // Guardar el token de impersonación en sessionStorage.
        // El cliente HTTP del admin lo leerá primero antes de usar la cookie.
        sessionStorage.setItem("impersonation_token", result.accessToken);
        sessionStorage.setItem("impersonation_tenant", tenantName);
        router.push("/admin");
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
