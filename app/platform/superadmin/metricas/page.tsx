import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  getPlatformGmv,
  getPlatformGrowth,
  getPlatformHealth,
  getPlatformRevenue,
  parseRange,
  type RangeParams,
} from "@/lib/data/analytics";
import { formatCop } from "@/lib/format";
import { ColumnChart } from "@/components/analytics/column-chart";
import {
  AnalyticsTabs,
  BarList,
  Kpi,
  LoadError,
  Panel,
  RangeBar,
  StatusPill,
} from "@/components/analytics/kit";
import { PALETTE, formatDateLabel, formatPct } from "@/components/analytics/format";

export const metadata: Metadata = { title: "Métricas · Plataforma" };

const BASE = "/platform/superadmin/metricas";
type SP = Record<string, string | string[] | undefined>;

const TABS = [
  { key: "ingresos", label: "Ingresos" },
  { key: "ventas", label: "Ventas de las tiendas" },
  { key: "tiendas", label: "Altas y bajas" },
  { key: "salud", label: "Salud" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const TIERS = ["STARTER", "PRO", "BUSINESS"] as const;
const BILLING_TYPE: Record<string, string> = {
  SUBSCRIPTION: "Suscripción",
  ONE_TIME: "Pago único + mantenimiento",
  COMMISSION: "Comisión + mantenimiento",
};
const BILLING_STATUS: Record<string, string> = {
  ACTIVE: "Al día",
  PAST_DUE: "Pago pendiente",
  INACTIVE: "Suspendidas",
  CANCELLED: "Canceladas",
};
const LEVEL_LABEL = { ok: "Sana", attention: "Atención", risk: "En riesgo" } as const;

const tenantHref = (id: string) => `/platform/superadmin/tenants/${id}`;

export default async function PlatformMetricsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const requested = typeof sp.tab === "string" ? sp.tab : "";
  const tab: TabKey = TABS.find((t) => t.key === requested)?.key ?? "ingresos";
  const range = parseRange(sp);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresos de la plataforma, lo que venden las tiendas y cuáles necesitan atención.
          </p>
        </div>
        {tab !== "salud" && <RangeBar base={BASE} sp={sp} range={range} />}
      </header>
      <AnalyticsTabs base={BASE} sp={sp} tabs={[...TABS]} active={tab} />
      {tab === "ingresos" && <RevenueTab range={range} />}
      {tab === "ventas" && <GmvTab range={range} />}
      {tab === "tiendas" && <GrowthTab range={range} />}
      {tab === "salud" && <HealthTab />}
    </div>
  );
}

// ── Ingresos ─────────────────────────────────────────────────────────────────

async function RevenueTab({ range }: { range: RangeParams }) {
  const res = await getPlatformRevenue(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const r = res.data;
  const typeRows = Object.entries(r.mrrByBillingType).filter(([, v]) => v > 0);

  return (
    <div className="space-y-6">
      {r.missingAmount.length > 0 && (
        <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900">
          {r.missingAmount.length === 1 ? "Una tienda con cobro recurrente no tiene" : `${r.missingAmount.length} tiendas con cobro recurrente no tienen`}{" "}
          monto cargado y no suman al MRR:{" "}
          {r.missingAmount.slice(0, 6).map((t, i) => (
            <span key={t.id}>
              {i > 0 && ", "}
              <Link href={tenantHref(t.id)} className="font-medium underline underline-offset-2">
                {t.name}
              </Link>
            </span>
          ))}
          {r.missingAmount.length > 6 && ` y ${r.missingAmount.length - 6} más`}.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={formatCop(r.mrrCents)} hint={`ARR ${formatCop(r.arrCents)}`} />
        <Kpi
          label="Comisiones"
          value={formatCop(r.commissionCents)}
          hint="devengadas en el periodo"
          change={r.commissionChange}
        />
        <Kpi label="Pagos únicos" value={formatCop(r.oneTimeCents)} hint="registrados en el periodo" />
        <Kpi
          label="Ingreso del periodo"
          value={formatCop(r.totalInRangeCents)}
          hint="MRR prorrateado + comisiones + únicos"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Comisiones devengadas"
          description="% acordado × ventas pagadas de cada tienda con comisión. Estimado: no hay conciliación de cobros."
          className="lg:col-span-2"
        >
          <ColumnChart
            title="Comisiones devengadas"
            data={r.series.map((p) => ({ date: p.date, values: [p.commissionCents] }))}
            series={[{ name: "Comisión", color: PALETTE.blue }]}
            format="cop"
            granularity={r.range.granularity}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="MRR por plan">
            <BarList
              items={TIERS.map((t) => ({
                label: t,
                value: r.mrrByTier[t],
                display: formatCop(r.mrrByTier[t]),
              }))}
            />
          </Panel>
          <Panel title="MRR por modalidad">
            <BarList
              items={typeRows.map(([k, v]) => ({ label: BILLING_TYPE[k] ?? k, value: v, display: formatCop(v) }))}
              empty="Sin cobros recurrentes."
            />
          </Panel>
        </div>
      </div>

      {r.commissionByTenant.length > 0 && (
        <Panel title="Comisión por tienda">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Tienda</th>
                <th className="pb-2 text-right font-medium">%</th>
                <th className="pb-2 text-right font-medium">Ventas</th>
                <th className="pb-2 text-right font-medium">Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {r.commissionByTenant.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">
                    <Link href={tenantHref(t.id)} className="hover:underline">{t.name}</Link>
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatPct(t.pct)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{formatCop(t.gmvCents)}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatCop(t.commissionCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

// ── Ventas de las tiendas (GMV) ──────────────────────────────────────────────

async function GmvTab({ range }: { range: RangeParams }) {
  const res = await getPlatformGmv(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const g = res.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Vendido" value={formatCop(g.totals.gmvCents)} hint="todas las tiendas" change={g.change.gmv} />
        <Kpi label="Pedidos" value={g.totals.orders.toLocaleString("es-CO")} hint="pagados" change={g.change.orders} />
        <Kpi label="Ticket promedio" value={formatCop(g.totals.avgTicketCents)} hint="de la red" />
        <Kpi
          label="Tiendas que vendieron"
          value={String(g.totals.sellingStores)}
          hint={`${g.previous.sellingStores} en el periodo anterior`}
        />
      </section>

      <Panel
        title="Ventas de la red"
        description={`Del ${formatDateLabel(g.range.from)} al ${formatDateLabel(g.range.to)}`}
      >
        <ColumnChart
          title="Ventas de la red"
          data={g.series.map((p) => ({ date: p.date, values: [p.cents] }))}
          series={[{ name: "Vendido", color: PALETTE.blue }]}
          format="cop"
          granularity={g.range.granularity}
        />
      </Panel>

      <Panel title="Por tienda" description="Comparado con el periodo anterior de igual largo.">
        {g.byTenant.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguna tienda vendió en este periodo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Tienda</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 text-right font-medium">Vendido</th>
                <th className="pb-2 text-right font-medium">Anterior</th>
                <th className="pb-2 text-right font-medium">Cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {g.byTenant.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">
                    <Link href={tenantHref(t.id)} className="hover:underline">{t.name}</Link>
                  </td>
                  <td className="py-2"><Badge variant="outline">{t.tier}</Badge></td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatCop(t.gmvCents)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{formatCop(t.previousCents)}</td>
                  <td
                    className={
                      "py-2 text-right tabular-nums " +
                      (t.change === null ? "text-muted-foreground" : t.change >= 0 ? "text-emerald-700" : "text-destructive")
                    }
                  >
                    {t.change === null ? "nueva" : `${t.change > 0 ? "+" : ""}${formatPct(t.change)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

// ── Altas y bajas ────────────────────────────────────────────────────────────

async function GrowthTab({ range }: { range: RangeParams }) {
  const res = await getPlatformGrowth(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const g = res.data;
  const live = TIERS.reduce((a, t) => a + g.liveByTier[t], 0);
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tiendas vigentes" value={String(live)} hint={`${g.total} registradas`} />
        <Kpi label="Altas" value={String(g.newInRange)} hint="en el periodo" />
        <Kpi label="Cancelaciones" value={String(g.cancelledInRange)} hint="en el periodo" />
        <Kpi label="Churn" value={formatPct(g.churnPct)} hint="cancelaciones / vigentes al inicio" />
      </section>

      <Panel title="Altas y cancelaciones">
        <ColumnChart
          title="Altas y cancelaciones de tiendas"
          data={g.series.map((p) => ({ date: p.date, values: [p.new, p.cancelled] }))}
          series={[
            { name: "Altas", color: PALETTE.blue },
            { name: "Cancelaciones", color: PALETTE.orange },
          ]}
          format="count"
          granularity={g.range.granularity}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Vigentes por plan">
          <BarList items={TIERS.map((t) => ({ label: t, value: g.liveByTier[t], display: String(g.liveByTier[t]) }))} />
        </Panel>
        <Panel title="Estado de cobro">
          <ul className="divide-y divide-border text-sm">
            {Object.entries(BILLING_STATUS).map(([k, label]) => (
              <li key={k} className="flex justify-between py-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums font-medium">{g.byBillingStatus[k as keyof typeof g.byBillingStatus]}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Salud ────────────────────────────────────────────────────────────────────

async function HealthTab() {
  const res = await getPlatformHealth();
  if (!res.ok) return <LoadError status={res.status} />;
  const h = res.data;
  const days = (n: number | null) => (n === null ? "nunca" : n === 0 ? "hoy" : `hace ${n} d`);
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Sanas" value={String(h.summary.ok)} hint="puntaje 75 o más" />
        <Kpi label="Atención" value={String(h.summary.attention)} hint="entre 50 y 74" />
        <Kpi label="En riesgo" value={String(h.summary.risk)} hint="menos de 50" />
      </section>
      <Panel
        title="Tiendas, de peor a mejor"
        description="Cobro al día, uso del panel en los últimos 30 días, productos publicados, tendencia de pedidos y pasarela conectada."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Tienda</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Motivos</th>
                <th className="pb-2 text-right font-medium">Pedidos 30 d</th>
                <th className="pb-2 text-right font-medium">Último pedido</th>
                <th className="pb-2 text-right font-medium">Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {h.tenants.map((t) => (
                <tr key={t.id}>
                  <td className="py-2.5">
                    <Link href={tenantHref(t.id)} className="font-medium hover:underline">{t.name}</Link>
                    <div className="text-xs text-muted-foreground">{t.tier}</div>
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <StatusPill level={t.level}>
                      {LEVEL_LABEL[t.level]} · {t.score}
                    </StatusPill>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {t.reasons.length === 0 ? "Sin problemas" : t.reasons.join(" · ")}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {t.orders30}
                    <span className="text-xs text-muted-foreground"> / {t.orders30Prev}</span>
                  </td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {days(t.daysSinceLastOrder)}
                  </td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {days(t.daysSinceOperatorActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
