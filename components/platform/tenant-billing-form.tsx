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

type BillingType = "SUBSCRIPTION" | "ONE_TIME" | "COMMISSION";
type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";
type Tier = "STARTER" | "PRO" | "BUSINESS";

export interface TenantBilling {
  billingType: BillingType;
  billingStatus: BillingStatus;
  billingCycle: BillingCycle | null;
  billingStartedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  hasMaintenance: boolean;
  billingAmountCents: number | null;
  commissionPct: number | null;
  pendingCommissionPct: number | null;
}

const STATUSES: BillingStatus[] = ["ACTIVE", "PAST_DUE", "CANCELLED", "INACTIVE"];
const STATUS_LABEL: Record<BillingStatus, string> = {
  ACTIVE: "Al día",
  PAST_DUE: "Debe",
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
  tier,
  commissionEnabled,
  initial,
}: {
  tenantId: string;
  tier: Tier;
  /** Se fija al crear el tenant; si es false, COMMISSION no está disponible. */
  commissionEnabled: boolean;
  initial: TenantBilling;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La comisión solo se muestra si se habilitó al crear; y solo es seleccionable
  // en PRO/BUSINESS. Modalidades visibles:
  const TYPES: BillingType[] = commissionEnabled
    ? ["SUBSCRIPTION", "ONE_TIME", "COMMISSION"]
    : ["SUBSCRIPTION", "ONE_TIME"];
  const commissionSelectable = tier !== "STARTER";

  const [type, setType] = useState<BillingType>(initial.billingType);
  const [commissionPct, setCommissionPct] = useState(
    initial.commissionPct != null ? String(initial.commissionPct) : "",
  );
  const [status, setStatus] = useState<BillingStatus>(initial.billingStatus);
  const [cycle, setCycle] = useState<BillingCycle>(initial.billingCycle ?? "MONTHLY");
  const [hasMaintenance, setHasMaintenance] = useState(initial.hasMaintenance);
  const [amount, setAmount] = useState(
    initial.billingAmountCents != null ? String(initial.billingAmountCents / 100) : "",
  );
  const [startedAt, setStartedAt] = useState(toDateInput(initial.billingStartedAt));
  const [periodEnd, setPeriodEnd] = useState(toDateInput(initial.currentPeriodEnd));
  const [cancelledAt, setCancelledAt] = useState(toDateInput(initial.cancelledAt));

  const dirty = () => setSaved(false);

  // El mantenimiento aplica a pago único y a comisión (en suscripción es implícito).
  const maintenanceApplies = type === "ONE_TIME" || type === "COMMISSION";
  // ¿Hay cobro recurrente? Suscripción siempre; otras solo con mantenimiento.
  const isRecurring = type === "SUBSCRIPTION" || hasMaintenance;

  // ¿El % de comisión cambió respecto al activo? → requerirá aprobación del tenant.
  const pctNum = commissionPct.trim() === "" ? null : parseFloat(commissionPct);
  const commissionWillNeedApproval =
    type === "COMMISSION" &&
    initial.commissionPct != null &&
    pctNum != null &&
    pctNum !== initial.commissionPct;

  function handleSave() {
    setError(null);
    const amountCents =
      amount.trim() === "" ? null : Math.round(parseFloat(amount) * 100);

    startTransition(async () => {
      const result = await updateTenantAction(tenantId, {
        billingType: type,
        billingStatus: status,
        hasMaintenance: maintenanceApplies ? hasMaintenance : false,
        billingAmountCents: Number.isNaN(amountCents as number) ? null : amountCents,
        // El ciclo y el próximo cobro solo aplican si hay recurrencia.
        billingCycle: isRecurring ? cycle : null,
        billingStartedAt: startedAt || null,
        currentPeriodEnd: isRecurring ? periodEnd || null : null,
        cancelledAt: status === "CANCELLED" ? cancelledAt || null : null,
        // Comisión: solo se envía si la modalidad es COMMISSION y hay valor.
        ...(type === "COMMISSION" && pctNum != null ? { commissionPct: pctNum } : {}),
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Modalidad de cobro */}
      <div>
        <label className="text-sm font-medium">Modalidad de cobro</label>
        <div
          className={
            "mt-2 grid gap-2 " +
            (TYPES.length === 3 ? "grid-cols-3" : "grid-cols-2")
          }
        >
          {TYPES.map((t) => {
            const disabled = t === "COMMISSION" && !commissionSelectable;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                title={disabled ? "Solo disponible en planes PRO y BUSINESS" : undefined}
                onClick={() => { setType(t); dirty(); }}
                aria-pressed={type === t}
                className={
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                  (disabled
                    ? "border-border text-muted-foreground/50 cursor-not-allowed"
                    : type === t
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/40")
                }
              >
                {BILLING_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
        {commissionEnabled && !commissionSelectable && (
          <p className="text-xs text-muted-foreground mt-1.5">
            La comisión por ventas requiere plan PRO o BUSINESS.
          </p>
        )}
      </div>

      {/* Comisión por ventas */}
      {type === "COMMISSION" && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <label className="text-sm font-medium">% de comisión sobre ventas</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={commissionPct}
              onChange={(e) => { setCommissionPct(e.target.value); dirty(); }}
              placeholder="8"
              className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-right outline-none focus-visible:border-foreground/40"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          {initial.pendingCommissionPct != null && (
            <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
              Hay un cambio a {initial.pendingCommissionPct}% pendiente de aprobación
              del tenant.
            </p>
          )}
          {commissionWillNeedApproval && (
            <p className="text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1.5">
              Cambiar el % enviará una solicitud al dueño del tenant; el % actual
              ({initial.commissionPct}%) sigue vigente hasta que la apruebe.
            </p>
          )}
        </div>
      )}

      {/* Pago único / comisión: ¿lleva mantenimiento recurrente? */}
      {maintenanceApplies && (
        <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 cursor-pointer">
          <span>
            <span className="block text-sm font-medium">
              Cobrar mantenimiento recurrente
            </span>
            <span className="block text-xs text-muted-foreground">
              Cuota periódica por el servicio (servidor, soporte), aparte del
              {type === "COMMISSION" ? " cobro por comisión." : " pago inicial."}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hasMaintenance}
            onClick={() => { setHasMaintenance((v) => !v); dirty(); }}
            className={
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
              (hasMaintenance ? "bg-foreground" : "bg-muted-foreground/30")
            }
          >
            <span
              className={
                "inline-block size-4 transform rounded-full bg-background transition-transform " +
                (hasMaintenance ? "translate-x-6" : "translate-x-1")
              }
            />
          </button>
        </label>
      )}

      {/* Estado de pago */}
      <div>
        <label className="text-sm font-medium">Estado de pago</label>
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

      {/* Monto + ciclo */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {isRecurring ? "Monto por cobro (COP)" : "Monto del pago (COP)"}
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); dirty(); }}
            placeholder="200000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
          />
        </div>

        {isRecurring && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frecuencia del cobro</label>
            <div className="grid grid-cols-3 gap-2">
              {(["MONTHLY", "QUARTERLY", "ANNUAL"] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCycle(c); dirty(); }}
                  aria-pressed={cycle === c}
                  className={
                    "rounded-md border px-2 py-2 text-xs transition-colors " +
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
      </div>

      {/* Fechas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <DateField
          label={
            type === "SUBSCRIPTION"
              ? "Inicio de suscripción"
              : "Fecha del pago inicial"
          }
          value={startedAt}
          onChange={(v) => { setStartedAt(v); dirty(); }}
        />
        {isRecurring && (
          <DateField
            label="Próximo cobro"
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
