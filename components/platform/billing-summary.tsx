import { CalendarClock, CheckCircle2, AlertCircle, CircleSlash } from "lucide-react";
import { formatCop } from "@/lib/format";
import {
  isOverdue,
  BILLING_CYCLE_LABEL,
  type BillingStatus,
} from "./billing-badge";

export interface BillingSummaryData {
  billingType: "SUBSCRIPTION" | "ONE_TIME" | "COMMISSION";
  billingStatus: BillingStatus;
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL" | null;
  currentPeriodEnd: string | null;
  hasMaintenance: boolean;
  billingAmountCents: number | null;
  commissionPct?: number | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Frase legible de cómo se le cobra a la empresa.
export function billingScheduleText(d: BillingSummaryData): string {
  const amount = d.billingAmountCents != null ? formatCop(d.billingAmountCents) : null;
  const cycle = d.billingCycle ? BILLING_CYCLE_LABEL[d.billingCycle].toLowerCase() : "periódico";
  const maintenance =
    d.hasMaintenance
      ? ` + mantenimiento ${cycle}${amount ? ` de ${amount}` : ""}`
      : "";

  // Comisión por ventas (+ mantenimiento opcional a cargo del negocio).
  if (d.billingType === "COMMISSION") {
    const pct = d.commissionPct != null ? `${d.commissionPct}%` : "—";
    return `Comisión del ${pct} sobre ventas${maintenance}`;
  }

  const recurring = d.billingType === "SUBSCRIPTION" || d.hasMaintenance;
  if (!recurring) {
    return amount ? `Pago único de ${amount}` : "Pago único";
  }
  const base =
    d.billingType === "ONE_TIME"
      ? `Pago único + mantenimiento ${cycle}`
      : `Suscripción ${cycle}`;
  return amount ? `${base} de ${amount}` : base;
}

/**
 * Vista rápida del estado de cobro de un tenant — pensada para el control
 * rutinario (¿pagó? ¿debe? ¿cuándo es el próximo cobro?).
 */
export function BillingSummary({ data }: { data: BillingSummaryData }) {
  const recurring = data.billingType === "SUBSCRIPTION" || data.hasMaintenance;
  const overdue =
    recurring &&
    data.billingStatus === "ACTIVE" &&
    isOverdue(data.currentPeriodEnd);

  // Estado de pago efectivo para la vista de control.
  const pay: { label: string; tone: string; Icon: typeof CheckCircle2 } =
    data.billingStatus === "ACTIVE" && !overdue
      ? { label: "Pagado / al día", tone: "text-emerald-700", Icon: CheckCircle2 }
      : data.billingStatus === "PAST_DUE" || overdue
        ? { label: "Debe", tone: "text-red-600", Icon: AlertCircle }
        : data.billingStatus === "CANCELLED"
          ? { label: "Cancelada", tone: "text-muted-foreground", Icon: CircleSlash }
          : { label: "Inactiva", tone: "text-muted-foreground", Icon: CircleSlash };

  return (
    <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <pay.Icon className={"size-5 " + pay.tone} />
        <span className={"text-sm font-semibold " + pay.tone}>{pay.label}</span>
      </div>
      <p className="text-sm text-foreground">{billingScheduleText(data)}</p>
      {recurring && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          {overdue ? (
            <span className="text-red-600 font-medium">
              Cobro vencido el {fmtDate(data.currentPeriodEnd)}
            </span>
          ) : (
            <span>Próximo cobro: {fmtDate(data.currentPeriodEnd)}</span>
          )}
        </p>
      )}
    </div>
  );
}
