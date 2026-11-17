"use client";

import { useState, useTransition } from "react";
import { PauseCircle, SkipForward, Check, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type SubStatus, SUB_STATUS_LABEL } from "@/lib/mocks/account";
import type { CustomerSubscription } from "@/lib/data/account";
import { formatCop } from "@/lib/format";
import {
  updateSubscriptionAction,
  type SubscriptionActionInput,
} from "@/lib/actions/customer-account";
import { CancelModal } from "./cancel-modal";

const STATUS_TONE: Record<SubStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  PAUSED: "bg-muted text-muted-foreground border-border",
  PAYMENT_FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};
const AWAITING_TONE = "bg-amber-500/10 text-amber-800 border-amber-500/20";

const FREQS = [7, 14, 21, 28, 42, 56];

// Estado que devuelve la API → estado de la tarjeta.
const API_STATUS: Record<string, SubStatus> = {
  ACTIVE: "ACTIVE",
  SKIPPED_NEXT: "ACTIVE",
  PAUSED: "PAUSED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CANCELLED: "CANCELLED",
};

export function SubscriptionCard({ sub }: { sub: CustomerSubscription }) {
  const [freq, setFreq] = useState(sub.frequencyDays);
  const [status, setStatus] = useState<SubStatus>(sub.status);
  const [skipped, setSkipped] = useState(Boolean(sub.skippedNext));
  const [showCancel, setShowCancel] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const awaiting = Boolean(sub.awaitingFirstPayment) && status === "PAYMENT_FAILED";
  const active = status === "ACTIVE";
  const cancelled = status === "CANCELLED";

  // Sin cambios optimistas: la tarjeta refleja lo que confirma la API (las
  // fechas se recalculan al recargar la página, que la acción revalida).
  const runAction = (input: SubscriptionActionInput) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSubscriptionAction(sub.id, input);
      setFeedback({ ok: res.ok, text: res.message });
      if (!res.ok) return;
      if (res.status) {
        setStatus(API_STATUS[res.status] ?? status);
        setSkipped(res.status === "SKIPPED_NEXT");
      }
      if (res.frequencyDays) setFreq(res.frequencyDays);
    });
  };

  const badgeLabel = awaiting
    ? "Esperando pago"
    : skipped && active
      ? "Próximo envío saltado"
      : SUB_STATUS_LABEL[status];

  return (
    <>
      <article className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          {sub.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sub.imageUrl}
              alt=""
              className="size-16 rounded-md bg-muted flex-shrink-0 object-cover"
            />
          ) : (
            <div className="size-16 rounded-md bg-muted flex-shrink-0" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={awaiting ? AWAITING_TONE : STATUS_TONE[status]}>
                {badgeLabel}
              </Badge>
              {sub.variantLabel && (
                <Badge variant="outline" className="font-normal">
                  {sub.variantLabel}
                </Badge>
              )}
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {sub.productName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCop(sub.unitPriceCents)} por envío (más el envío, si aplica) · 1 unidad
              cada {freq / 7} sem
            </p>
            {feedback && (
              <p
                className={
                  "mt-2 inline-flex items-center gap-1.5 text-xs font-medium " +
                  (feedback.ok ? "text-emerald-700" : "text-destructive")
                }
              >
                {feedback.ok ? (
                  <Check className="size-3.5" />
                ) : (
                  <AlertCircle className="size-3.5" />
                )}
                {feedback.text}
              </p>
            )}
          </div>
          {active ? (
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Próximo envío
              </div>
              <div className="font-display text-2xl font-semibold mt-1">
                {sub.nextShipAt}
              </div>
              {sub.daysUntilNext >= 0 && (
                <div className="text-xs text-muted-foreground">
                  {sub.daysUntilNext === 0 ? "hoy" : `en ${sub.daysUntilNext} días`}
                </div>
              )}
            </div>
          ) : status === "PAUSED" ? (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runAction({ action: "RESUME" })}
            >
              Reactivar
            </Button>
          ) : null}
        </div>

        {awaiting && (
          <div className="border-t border-border bg-muted/30 px-5 py-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Clock className="size-4 text-amber-700" />
            <span className="flex-1 min-w-[12rem]">
              Se activa cuando la tienda confirme el pago de tu primer pedido. Después, cada envío
              genera un pedido nuevo que se paga igual que el primero.
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction({ action: "CANCEL" })}
              className="text-destructive hover:underline underline-offset-2 disabled:opacity-50"
            >
              Cancelar suscripción
            </button>
          </div>
        )}

        {status === "PAYMENT_FAILED" && !awaiting && (
          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            El último cobro no se pudo completar. Contacta a la tienda para reanudar tus envíos.
          </div>
        )}

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
                    type="button"
                    disabled={isPending || d === freq}
                    onClick={() =>
                      runAction({ action: "CHANGE_FREQUENCY", frequencyDays: d })
                    }
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
              <p className="mt-3 text-[11px] text-muted-foreground">
                Cada envío genera un pedido que se paga igual que el primero. La nueva frecuencia
                aplica desde el siguiente envío.
              </p>
            </div>

            <div className="border-t border-border bg-muted/30 px-5 py-3 flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => runAction({ action: "SKIP_NEXT" })}
              >
                <SkipForward className="size-3.5" />
                Saltar próximo envío
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => runAction({ action: "PAUSE" })}
              >
                <PauseCircle className="size-3.5" />
                Pausar
              </Button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowCancel(true)}
                className="ml-auto text-xs text-destructive hover:underline underline-offset-2"
              >
                Cancelar suscripción
              </button>
            </div>
          </>
        )}

        {status === "PAUSED" && (
          <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1">Sin envíos hasta que la reactives.</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowCancel(true)}
              className="text-destructive hover:underline underline-offset-2"
            >
              Cancelar suscripción
            </button>
          </div>
        )}
      </article>

      {!cancelled && (
        <CancelModal
          open={showCancel}
          onOpenChange={setShowCancel}
          productName={sub.productName}
          pending={isPending}
          onSkipNext={active ? () => runAction({ action: "SKIP_NEXT" }) : undefined}
          onPause={active ? () => runAction({ action: "PAUSE" }) : undefined}
          onReduceFrequency={
            active && freq < 56
              ? () => runAction({ action: "CHANGE_FREQUENCY", frequencyDays: 56 })
              : undefined
          }
          onConfirmCancel={() => runAction({ action: "CANCEL" })}
        />
      )}
    </>
  );
}
