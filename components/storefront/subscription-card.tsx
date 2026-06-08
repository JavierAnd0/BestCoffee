"use client";

import { useState } from "react";
import { Coffee, PauseCircle, SkipForward, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type MockSubscription,
  type SubStatus,
  SUB_STATUS_LABEL,
} from "@/lib/mocks/account";
import { formatCop } from "@/lib/format";
import { CancelModal } from "./cancel-modal";

const STATUS_TONE: Record<SubStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  PAUSED: "bg-muted text-muted-foreground border-border",
  PAYMENT_FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const FREQS = [7, 14, 21, 28, 42, 56];

export function SubscriptionCard({ sub }: { sub: MockSubscription }) {
  const [freq, setFreq] = useState(sub.frequencyDays);
  const [showCancel, setShowCancel] = useState(false);

  const active = sub.status === "ACTIVE";

  return (
    <>
      <article className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <div className="size-16 rounded-md bg-muted flex-shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_TONE[sub.status]}>
                {SUB_STATUS_LABEL[sub.status]}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {sub.variantLabel}
              </Badge>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {sub.productName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCop(sub.unitPriceCents)} cada entrega · –15% suscriptor
            </p>
          </div>
          {active ? (
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Próximo envío
              </div>
              <div className="font-display text-2xl font-semibold mt-1">
                {sub.nextShipAt}
              </div>
              <div className="text-xs text-muted-foreground">
                en {sub.daysUntilNext} días
              </div>
            </div>
          ) : (
            <Button size="sm">Reactivar</Button>
          )}
        </div>

        {active && (
          <>
            <div className="border-t border-border px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Frecuencia de entrega
              </div>
              <div className="flex flex-wrap gap-2">
                {FREQS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFreq(d)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition-colors " +
                      (d === freq
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-foreground/70 hover:border-foreground/40")
                    }
                  >
                    {d / 7} sem
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border bg-muted/30 px-5 py-3 flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm">
                <SkipForward className="size-3.5" />
                Saltar este envío
              </Button>
              <Button variant="outline" size="sm">
                <PauseCircle className="size-3.5" />
                Pausar
              </Button>
              <Button variant="outline" size="sm">
                <Coffee className="size-3.5" />
                Cambiar producto
              </Button>
              <Button variant="outline" size="sm">
                <Pin className="size-3.5" />
                Cambiar dirección
              </Button>
              <button
                onClick={() => setShowCancel(true)}
                className="ml-auto text-xs text-destructive hover:underline underline-offset-2"
              >
                Cancelar suscripción
              </button>
            </div>
          </>
        )}
      </article>

      <CancelModal open={showCancel} onOpenChange={setShowCancel} productName={sub.productName} />
    </>
  );
}
