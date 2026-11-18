"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  runAdminSubscriptionAction,
  updateAdminSubscriptionTermsAction,
  type AdminSubscriptionAction,
} from "@/lib/actions/admin-subscriptions";
import type { AdminSubDisplayStatus } from "@/lib/data/admin-subscriptions";

const FREQS = [7, 14, 21, 28, 42, 56];

const DONE_TITLE: Record<AdminSubscriptionAction, string> = {
  pause: "Suscripción pausada",
  resume: "Suscripción reanudada",
  skipNext: "Próximo envío saltado",
  cancel: "Suscripción cancelada",
};

export function SubscriptionRowActions({
  id,
  status,
  frequencyDays,
  customerName,
}: {
  id: string;
  status: AdminSubDisplayStatus;
  frequencyDays: number;
  customerName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const running = status === "ACTIVE" || status === "SKIPPED_NEXT";
  const canPause = running || status === "PAYMENT_FAILED";
  const cancelled = status === "CANCELLED";
  // Sin activar: solo se activa al marcar pagado su primer pedido (Pedidos).
  const awaiting = status === "AWAITING_FIRST_PAYMENT";

  const run = (action: AdminSubscriptionAction) => {
    setError(null);
    if (
      action === "cancel" &&
      !window.confirm(`¿Cancelar la suscripción de ${customerName}? No se generarán más pedidos y se le avisará por correo.`)
    ) {
      return;
    }
    startTransition(async () => {
      const res = await runAdminSubscriptionAction(id, action);
      if (res.ok) {
        toast({
          title: DONE_TITLE[action],
          description: `Se le envía un aviso por correo a ${customerName}.`,
        });
      } else {
        setError(res.error);
      }
      router.refresh();
    });
  };

  const changeFrequency = (days: number) => {
    setError(null);
    startTransition(async () => {
      const res = await updateAdminSubscriptionTermsAction(id, { frequencyDays: days });
      if (res.ok) {
        toast({
          title: `Frecuencia cambiada: cada ${days / 7} sem`,
          description: `Se le envía un aviso por correo a ${customerName}.`,
        });
      } else {
        setError(res.error);
      }
      router.refresh();
    });
  };

  if (cancelled) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        <select
          aria-label="Frecuencia"
          value={FREQS.includes(frequencyDays) ? frequencyDays : ""}
          disabled={pending}
          onChange={(e) => changeFrequency(Number(e.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {!FREQS.includes(frequencyDays) && <option value="">{frequencyDays} d</option>}
          {FREQS.map((d) => (
            <option key={d} value={d}>
              cada {d / 7} sem
            </option>
          ))}
        </select>
        {running && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Saltar próximo envío"
            title="Saltar próximo envío"
            disabled={pending}
            onClick={() => run("skipNext")}
          >
            <SkipForward className="size-3.5" />
          </Button>
        )}
        {canPause && !awaiting && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Pausar"
            title="Pausar"
            disabled={pending}
            onClick={() => run("pause")}
          >
            <Pause className="size-3.5" />
          </Button>
        )}
        {status === "PAUSED" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reanudar"
            title="Reanudar"
            disabled={pending}
            onClick={() => run("resume")}
          >
            <Play className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cancelar suscripción"
          title="Cancelar suscripción"
          disabled={pending}
          onClick={() => run("cancel")}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {error && <p className="text-[11px] text-destructive max-w-56 text-right">{error}</p>}
    </div>
  );
}
