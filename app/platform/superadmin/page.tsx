import Link from "next/link";
import type { Metadata } from "next";
import {
  Store,
  Users,
  ShoppingBag,
  Plus,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCop } from "@/lib/format";
import { platformFetch } from "@/lib/api/platform";
import {
  BillingBadge,
  isOverdue,
  type BillingStatus,
} from "@/components/platform/billing-badge";
import { billingScheduleText } from "@/components/platform/billing-summary";

export const metadata: Metadata = { title: "Dashboard · Superadmin" };

type Tier = "STARTER" | "PRO" | "BUSINESS";

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  createdAt: string;
  billingType: "SUBSCRIPTION" | "ONE_TIME" | "COMMISSION";
  billingStatus: BillingStatus;
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL" | null;
  currentPeriodEnd: string | null;
  hasMaintenance: boolean;
  billingAmountCents: number | null;
  commissionPct: number | null;
  _count: { memberships: number; orders: number; customers: number };
}

const TIERS: Tier[] = ["STARTER", "PRO", "BUSINESS"];

const TIER_TONE: Record<Tier, string> = {
  STARTER: "bg-muted text-muted-foreground border-border",
  PRO: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  BUSINESS: "bg-violet-500/10 text-violet-700 border-violet-500/20",
};

const TIER_BAR: Record<Tier, string> = {
  STARTER: "bg-muted-foreground/40",
  PRO: "bg-blue-500",
  BUSINESS: "bg-violet-500",
};

// Cuota mensual indicativa por plan (COP). Es el ingreso recurrente estimado de
// la plataforma; ajusta estos valores a tus precios reales de mantenimiento.
const TIER_MRR_COP: Record<Tier, number> = {
  STARTER: 80_000,
  PRO: 200_000,
  BUSINESS: 450_000,
};

const BILLING_ATTENTION_LABEL: Record<BillingStatus, string> = {
  ACTIVE: "Renovación vencida",
  PAST_DUE: "Pago pendiente",
  CANCELLED: "Suscripción cancelada",
  INACTIVE: "Cuenta inactiva",
};

export default async function SuperadminDashboard() {
  const tenants = await platformFetch<TenantRow[]>("/v1/platform/tenants");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Una tienda con problema de cobro: pago pendiente, inactiva/cancelada, o
  // suscripción activa pero con renovación vencida.
  const hasBillingIssue = (t: TenantRow) =>
    t.billingStatus === "PAST_DUE" ||
    t.billingStatus === "INACTIVE" ||
    t.billingStatus === "CANCELLED" ||
    (t.billingStatus === "ACTIVE" && isOverdue(t.currentPeriodEnd));

  const stats = tenants.reduce(
    (acc, t) => {
      acc.orders += t._count.orders;
      acc.customers += t._count.customers;
      acc.byTier[t.tier] += 1;
      // MRR fijo: tenants al día con cobro fijo. La comisión es ingreso variable
      // (depende de sus ventas) → no se suma al MRR estimado.
      if (t.billingStatus === "ACTIVE" && t.billingType !== "COMMISSION") {
        acc.mrrCents += TIER_MRR_COP[t.tier] * 100;
      }
      if (t._count.orders > 0) acc.active += 1;
      if (new Date(t.createdAt) >= startOfMonth) acc.newThisMonth += 1;
      return acc;
    },
    {
      orders: 0,
      customers: 0,
      active: 0,
      newThisMonth: 0,
      mrrCents: 0,
      byTier: { STARTER: 0, PRO: 0, BUSINESS: 0 } as Record<Tier, number>,
    },
  );

  const total = tenants.length;
  const recent = [...tenants]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  // Cobros recurrentes (suscripción o pago único con mantenimiento), ordenados
  // por proximidad del próximo cobro — para el control rutinario mensual.
  const isRecurring = (t: TenantRow) =>
    t.billingStatus !== "CANCELLED" &&
    t.billingStatus !== "INACTIVE" &&
    (t.billingType === "SUBSCRIPTION" || t.hasMaintenance);
  const upcomingCharges = tenants
    .filter(isRecurring)
    .sort((a, b) => {
      const da = a.currentPeriodEnd ? +new Date(a.currentPeriodEnd) : Infinity;
      const db = b.currentPeriodEnd ? +new Date(b.currentPeriodEnd) : Infinity;
      return da - db;
    })
    .slice(0, 6);

  // Prioriza problemas de cobro; si no hay, cae a tiendas sin pedidos.
  const billingIssues = tenants.filter(hasBillingIssue);
  const needsAttention = (
    billingIssues.length > 0
      ? billingIssues
      : tenants.filter((t) => t._count.orders === 0)
  ).slice(0, 5);
  const attentionIsBilling = billingIssues.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de todas las cafeterías
          </p>
        </div>
        <Button
          render={
            <Link href="/platform/superadmin/tenants/new">
              <Plus className="size-4 mr-1.5" />
              Nuevo tenant
            </Link>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="MRR estimado"
          value={formatCop(stats.mrrCents)}
          hint="ingreso recurrente mensual"
          accent
        />
        <StatCard
          icon={Store}
          label="Tiendas activas"
          value={`${stats.active}/${total}`}
          hint={`${total - stats.active} sin pedidos`}
        />
        <StatCard
          icon={Users}
          label="Clientes totales"
          value={stats.customers.toLocaleString("es-CO")}
        />
        <StatCard
          icon={ShoppingBag}
          label="Pedidos totales"
          value={stats.orders.toLocaleString("es-CO")}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribución por plan + aporte de MRR */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Distribución por plan
            </h2>
            <span className="text-xs text-muted-foreground">
              {total} {total === 1 ? "tienda" : "tiendas"}
            </span>
          </div>

          <div className="space-y-4">
            {TIERS.map((t) => {
              const count = stats.byTier[t];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const mrr = TIER_MRR_COP[t] * 100 * count;
              return (
                <div key={t}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className={TIER_TONE[t]}>{t}</Badge>
                      <span className="text-muted-foreground tabular-nums">
                        {count} · {pct}%
                      </span>
                    </div>
                    <span className="font-medium tabular-nums">{formatCop(mrr)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={"h-full rounded-full " + TIER_BAR[t]}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crecimiento */}
        <div className="rounded-lg border border-border bg-background p-6 flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Crecimiento
          </h2>
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="size-5" />
            <span className="font-display text-4xl font-semibold tabular-nums">
              +{stats.newThisMonth}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            altas en {now.toLocaleDateString("es-CO", { month: "long" })}
          </p>
          <div className="mt-auto pt-4 border-t border-border text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Conversión activa</span>
              <span className="font-medium tabular-nums">
                {total > 0 ? Math.round((stats.active / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control de cobros — revisión rutinaria de cómo se factura a cada tienda */}
      <Panel
        title="Control de cobros"
        subtitle="Cobros recurrentes ordenados por proximidad"
        action={{ href: "/platform/superadmin/tenants", label: "Ver todos" }}
      >
        {upcomingCharges.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            No hay cobros recurrentes configurados.
          </p>
        ) : (
          upcomingCharges.map((t) => {
            const overdue =
              t.billingStatus === "ACTIVE" && isOverdue(t.currentPeriodEnd);
            return (
              <Link
                key={t.id}
                href={`/platform/superadmin/tenants/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {billingScheduleText({
                      billingType: t.billingType,
                      billingStatus: t.billingStatus,
                      billingCycle: t.billingCycle,
                      currentPeriodEnd: t.currentPeriodEnd,
                      hasMaintenance: t.hasMaintenance,
                      billingAmountCents: t.billingAmountCents,
                      commissionPct: t.commissionPct,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span
                    className={
                      "text-xs tabular-nums w-24 " +
                      (overdue ? "text-red-600 font-medium" : "text-muted-foreground")
                    }
                  >
                    {t.currentPeriodEnd
                      ? new Date(t.currentPeriodEnd).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })
                      : "sin fecha"}
                  </span>
                  <BillingBadge status={t.billingStatus} />
                </div>
              </Link>
            );
          })
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Altas recientes */}
        <Panel
          title="Altas recientes"
          action={{ href: "/platform/superadmin/tenants", label: "Ver todos" }}
        >
          {recent.length === 0 ? (
            <EmptyRow />
          ) : (
            recent.map((t) => (
              <Link
                key={t.id}
                href={`/platform/superadmin/tenants/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {t.slug}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={TIER_TONE[t.tier]}>{t.tier}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                    {new Date(t.createdAt).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            ))
          )}
        </Panel>

        {/* Necesitan atención */}
        <Panel
          title="Necesitan atención"
          subtitle={
            attentionIsBilling
              ? "Problemas de cobro a revisar"
              : "Tiendas sin pedidos todavía"
          }
        >
          {needsAttention.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              🎉 Todo en orden: cobros al día y tiendas con actividad.
            </p>
          ) : (
            needsAttention.map((t) => (
              <Link
                key={t.id}
                href={`/platform/superadmin/tenants/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="size-8 rounded-full bg-amber-500/10 grid place-items-center shrink-0">
                    <AlertTriangle className="size-4 text-amber-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attentionIsBilling
                        ? t.billingStatus === "ACTIVE"
                          ? "Renovación vencida"
                          : BILLING_ATTENTION_LABEL[t.billingStatus]
                        : `${t._count.customers} clientes · 0 pedidos`}
                    </p>
                  </div>
                </div>
                {attentionIsBilling ? (
                  <BillingBadge status={t.billingStatus} />
                ) : (
                  <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
                )}
              </Link>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-5 " +
        (accent
          ? "border-foreground/20 bg-foreground/[0.03]"
          : "border-border bg-background")
      }
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-[11px] uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl lg:text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 normal-case">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs text-primary hover:underline shrink-0"
          >
            {action.label} →
          </Link>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function EmptyRow() {
  return (
    <p className="p-5 text-sm text-muted-foreground">
      Aún no hay tenants.{" "}
      <Link
        href="/platform/superadmin/tenants/new"
        className="text-primary hover:underline"
      >
        Crear el primero
      </Link>
    </p>
  );
}
