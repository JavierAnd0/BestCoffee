"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTenantAction } from "@/lib/actions/platform";
import {
  BILLING_TYPE_LABEL,
  BILLING_CYCLE_LABEL,
  type BillingStatus,
} from "./billing-badge";

type BillingType = "SUBSCRIPTION" | "ONE_TIME";
type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface TenantBilling {
  billingType: BillingType;
  billingStatus: BillingStatus;
  billingCycle: BillingCycle | null;
  billingStartedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

const STATUSES: BillingStatus[] = ["ACTIVE", "PAST_DUE", "CANCELLED", "INACTIVE"];
const STATUS_LABEL: Record<BillingStatus, string> = {
  ACTIVE: "Activa",
  PAST_DUE: "Pago pendiente",
  CANCELLED: "Cancelada",
  INACTIVE: "Inactiva",
};

// ISO (posiblemente con hora) → YYYY-MM-DD para <input type="date">.
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function TenantBillingForm({
  tenantId,
  initial,
}: {
  tenantId: string;
  initial: TenantBilling;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<BillingType>(initial.billingType);
  const [status, setStatus] = useState<BillingStatus>(initial.billingStatus);
  const [cycle, setCycle] = useState<BillingCycle>(
    initial.billingCycle ?? "MONTHLY",
  );
  const [startedAt, setStartedAt] = useState(toDateInput(initial.billingStartedAt));
  const [periodEnd, setPeriodEnd] = useState(toDateInput(initial.currentPeriodEnd));
  const [cancelledAt, setCancelledAt] = useState(toDateInput(initial.cancelledAt));

  const dirty = () => setSaved(false);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateTenantAction(tenantId, {
        billingType: type,
        billingStatus: status,
        // El ciclo solo aplica a suscripciones; en pago único se limpia.
        billingCycle: type === "SUBSCRIPTION" ? cycle : null,
        billingStartedAt: startedAt || null,
        currentPeriodEnd: type === "SUBSCRIPTION" ? periodEnd || null : null,
        cancelledAt: status === "CANCELLED" ? cancelledAt || null : null,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const periodLabel =
    type === "SUBSCRIPTION" ? "Próxima renovación" : "Fin de mantenimiento";

  return (
    <div className="space-y-5">
      {/* Tipo de cobro */}
      <div>
        <label className="text-sm font-medium">Modalidad de cobro</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["SUBSCRIPTION", "ONE_TIME"] as BillingType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); dirty(); }}
              aria-pressed={type === t}
              className={
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                (type === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40")
              }
            >
              {BILLING_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className="text-sm font-medium">Estado</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); dirty(); }}
              aria-pressed={status === s}
              className={
                "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors " +
                (status === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40")
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Ciclo (solo suscripción) */}
      {type === "SUBSCRIPTION" && (
        <div>
          <label className="text-sm font-medium">Ciclo de facturación</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["MONTHLY", "QUARTERLY", "ANNUAL"] as BillingCycle[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCycle(c); dirty(); }}
                aria-pressed={cycle === c}
                className={
                  "rounded-md border px-3 py-2 text-sm transition-colors " +
                  (cycle === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40")
                }
              >
                {BILLING_CYCLE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fechas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <DateField
          label={type === "SUBSCRIPTION" ? "Inicio de suscripción" : "Fecha del pago"}
          value={startedAt}
          onChange={(v) => { setStartedAt(v); dirty(); }}
        />
        {type === "SUBSCRIPTION" && (
          <DateField
            label={periodLabel}
            value={periodEnd}
            onChange={(v) => { setPeriodEnd(v); dirty(); }}
          />
        )}
        {status === "CANCELLED" && (
          <DateField
            label="Fecha de cancelación"
            value={cancelledAt}
            onChange={(v) => { setCancelledAt(v); dirty(); }}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar facturación"}
        </Button>
        {saved && !isPending && (
          <span className="text-sm text-green-700 flex items-center gap-1">
            <Check className="size-4" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </div>
  );
}
