"use client";

import { useState, useTransition } from "react";
import { Percent, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  acceptCommissionAction,
  rejectCommissionAction,
} from "@/lib/actions/admin-billing";

/**
 * Banner que aparece en el panel del operador cuando la plataforma propone un
 * cambio en la comisión por ventas. El cambio NO aplica hasta que se acepte aquí.
 */
export function CommissionProposalBanner({
  currentPct,
  proposedPct,
}: {
  currentPct: number | null;
  proposedPct: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);

  function decide(kind: "accept" | "reject") {
    setError(null);
    startTransition(async () => {
      const action = kind === "accept" ? acceptCommissionAction : rejectCommissionAction;
      const res = await action();
      if (res.ok) setDone(kind === "accept" ? "accepted" : "rejected");
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-sm">
        {done === "accepted"
          ? `Aceptaste la nueva comisión del ${proposedPct}%. Ya está vigente.`
          : `Rechazaste el cambio. Tu comisión actual (${currentPct ?? "—"}%) sigue vigente.`}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <span className="size-9 rounded-full bg-amber-500/15 grid place-items-center shrink-0">
          <Percent className="size-4 text-amber-700" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">
            Propuesta de cambio en tu comisión
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            La plataforma propone ajustar tu comisión por ventas de{" "}
            <strong>{currentPct ?? "—"}%</strong> a{" "}
            <strong>{proposedPct}%</strong>. El cambio solo aplica si lo aceptas;
            mientras tanto sigue vigente tu comisión actual.
          </p>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          <div className="flex gap-2 mt-3">
            <Button size="sm" disabled={isPending} onClick={() => decide("accept")}>
              <Check className="size-4 mr-1.5" />
              Aceptar {proposedPct}%
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => decide("reject")}
            >
              <X className="size-4 mr-1.5" />
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
