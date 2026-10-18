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
      const result = await impersonateTenantAction(tenantId, tenantName);
      if (result.ok) {
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
