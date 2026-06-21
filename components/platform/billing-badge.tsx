import { Badge } from "@/components/ui/badge";

export type BillingStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED" | "INACTIVE";

const STATUS_META: Record<BillingStatus, { label: string; tone: string }> = {
  ACTIVE: {
    label: "Activa",
    tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  PAST_DUE: {
    label: "Pago pendiente",
    tone: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  CANCELLED: {
    label: "Cancelada",
    tone: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  INACTIVE: {
    label: "Inactiva",
    tone: "bg-muted text-muted-foreground border-border",
  },
};

/** Indica si la fecha de fin de periodo ya pasó (renovación vencida). */
export function isOverdue(currentPeriodEnd?: string | null): boolean {
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd).getTime() < Date.now();
}

export function BillingBadge({ status }: { status: BillingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.INACTIVE;
  return <Badge className={meta.tone}>{meta.label}</Badge>;
}

export const BILLING_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: "Suscripción",
  ONE_TIME: "Pago único",
};

export const BILLING_CYCLE_LABEL: Record<string, string> = {
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  ANNUAL: "Anual",
};
