import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getOperatorTenantRole } from "@/lib/data/operator-role";
import {
  getCustomerAnalytics,
  getProductAnalytics,
  getRoastPlan,
  getSalesAnalytics,
  getSubscriptionAnalytics,
  parseRange,
  type RangeParams,
} from "@/lib/data/analytics";
import type { TenantFeatures } from "@/lib/types";
import { formatCop, formatOrderCode } from "@/lib/format";
import { ColumnChart } from "@/components/analytics/column-chart";
import {
  AnalyticsTabs,
  BarList,
  Kpi,
  LoadError,
  LockedState,
  Panel,
  RangeBar,
  StatusPill,
} from "@/components/analytics/kit";
import {
  GRIND_LABEL,
  PALETTE,
  formatDateLabel,
  formatGrams,
  formatPct,
} from "@/components/analytics/format";

export const metadata: Metadata = { title: "Métricas · Admin" };

const BASE = "/admin/metricas";
type SP = Record<string, string | string[] | undefined>;
type TabKey = "ventas" | "suscripciones" | "productos" | "clientes" | "tueste";

const UPGRADE_ADVANCED =
  "Disponible en el plan BUSINESS. Pídele a la plataforma que active la analítica avanzada para tu tienda.";

export default async function MetricsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [tenant, role] = await Promise.all([getCurrentTenant(), getOperatorTenantRole()]);
  const f = tenant.features;
  const ordersOnly = role.ok && role.role === "TENANT_ORDERS";

  const tabs: { key: TabKey; label: string }[] = ordersOnly
    ? [{ key: "tueste", label: "Plan de tueste" }]
    : [
        { key: "ventas", label: "Ventas" },
        ...(f.subscriptions ? [{ key: "suscripciones" as const, label: "Suscripciones" }] : []),
        { key: "productos", label: "Productos" },
        { key: "clientes", label: "Clientes" },
        { key: "tueste", label: "Plan de tueste" },
      ];
  const requested = typeof sp.tab === "string" ? sp.tab : "";
  const tab = (tabs.find((t) => t.key === requested) ?? tabs[0]).key;
  const range = parseRange(sp);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Métricas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cómo va {tenant.name}: ventas, suscriptores, qué se vende y qué tostar.
          </p>
        </div>
        {tab !== "tueste" && f.checkout && <RangeBar base={BASE} sp={sp} range={range} />}
      </header>

      {!f.checkout ? (
        <LockedState
          title="Tu plan aún no vende en línea"
          body="Las métricas se arman con los pedidos de la tienda. Con el plan PRO tu catálogo recibe pedidos y aquí verás ventas, productos y clientes."
        />
      ) : (
        <>
          <AnalyticsTabs base={BASE} sp={sp} tabs={tabs} active={tab} />
          {tab === "ventas" && <SalesTab range={range} features={f} />}
          {tab === "suscripciones" && <SubscriptionsTab range={range} />}
          {tab === "productos" && <ProductsTab range={range} />}
          {tab === "clientes" && <CustomersTab range={range} advanced={f.advancedAnalytics} />}
          {tab === "tueste" && <RoastTab advanced={f.advancedAnalytics} />}
        </>
      )}
    </div>
  );
}

// ── Ventas ───────────────────────────────────────────────────────────────────

async function SalesTab({ range, features }: { range: RangeParams; features: TenantFeatures }) {
  const res = await getSalesAnalytics(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const s = res.data;
  const gross = s.totals.revenueCents + s.totals.discountCents;
  const showGifts = features.gifts || s.bySource.some((b) => b.source === "GIFT" && b.cents > 0);
  const series = [
    { name: "Compra suelta", color: PALETTE.blue },
    ...(features.subscriptions ? [{ name: "Suscripción", color: PALETTE.orange }] : []),
    ...(showGifts ? [{ name: "Regalo", color: PALETTE.aqua }] : []),
  ];
  const data = s.series.map((p) => ({
    date: p.date,
    values: [
      p.checkoutCents,
      ...(features.subscriptions ? [p.subscriptionCents] : []),
      ...(showGifts ? [p.giftCents] : []),
    ],
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Ingresos"
          value={formatCop(s.totals.revenueCents)}
          hint="pedidos pagados"
          change={s.change.revenue}
        />
        <Kpi label="Pedidos" value={String(s.totals.orders)} hint="pagados" change={s.change.orders} />
        <Kpi
          label="Ticket promedio"
          value={formatCop(s.totals.avgTicketCents)}
          hint="por pedido"
          change={s.change.avgTicket}
        />
        <Kpi
          label="Descuentos"
          value={formatCop(s.totals.discountCents)}
          hint={gross > 0 ? `${formatPct((s.totals.discountCents / gross) * 100)} de lo vendido` : "sin ventas"}
        />
      </section>

      <Panel
        title="Ingresos por origen"
        description={`Del ${formatDateLabel(s.range.from)} al ${formatDateLabel(s.range.to)} · comparado con ${formatDateLabel(s.range.previous.from)} – ${formatDateLabel(s.range.previous.to)}`}
      >
        <ColumnChart
          title="Ingresos por origen"
          data={data}
          series={series}
          format="cop"
          granularity={s.range.granularity}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Por cobrar"
          description="Pedidos sin pago confirmado (transferencia o contra entrega). Estado actual."
          action={
            <Link href="/admin/pedidos" className="text-xs text-muted-foreground hover:text-foreground">
              Ver pedidos →
            </Link>
          }
        >
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold tabular-nums">
              {formatCop(s.pendingPayment.cents)}
            </span>
            <span className="text-sm text-muted-foreground">
              en {s.pendingPayment.count} pedido{s.pendingPayment.count === 1 ? "" : "s"}
            </span>
          </div>
          {s.pendingPayment.oldest.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos por cobrar.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.pendingPayment.oldest.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/pedidos/${o.id}`} className="min-w-0 hover:underline">
                    <span className="font-medium">{formatOrderCode(o.id)}</span>
                    <span className="ml-2 truncate text-muted-foreground">{o.customer}</span>
                  </Link>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">{formatCop(o.totalCents)}</span>
                    {o.ageDays >= 7 ? (
                      <StatusPill level="risk">{o.ageDays} días</StatusPill>
                    ) : o.ageDays >= 3 ? (
                      <StatusPill level="attention">{o.ageDays} días</StatusPill>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {o.ageDays === 0 ? "hoy" : `${o.ageDays} d`}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Códigos de descuento" description="Pedidos pagados que usaron cada código.">
          {s.promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún pedido usó códigos en este periodo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Código</th>
                  <th className="pb-2 text-right font-medium">Pedidos</th>
                  <th className="pb-2 text-right font-medium">Ingresos</th>
                  <th className="pb-2 text-right font-medium">Descontado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.promotions.map((p) => (
                  <tr key={p.code}>
                    <td className="py-2 font-mono text-xs">{p.code}</td>
                    <td className="py-2 text-right tabular-nums">{p.orders}</td>
                    <td className="py-2 text-right tabular-nums">{formatCop(p.revenueCents)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatCop(p.discountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Reembolsado</dt>
              <dd className="mt-0.5 tabular-nums">
                {formatCop(s.totals.refundedCents)}{" "}
                <span className="text-muted-foreground">({s.totals.refundedOrders})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pedidos cancelados</dt>
              <dd className="mt-0.5 tabular-nums">{s.totals.cancelledOrders}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}

// ── Suscripciones ────────────────────────────────────────────────────────────

const SUB_STATUS: Record<string, string> = {
  ACTIVE: "Activas",
  SKIPPED_NEXT: "Saltan el próximo envío",
  PAUSED: "Pausadas",
  PAYMENT_FAILED: "Pago fallido",
  CANCELLED: "Canceladas",
};

async function SubscriptionsTab({ range }: { range: RangeParams }) {
  const res = await getSubscriptionAnalytics(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const s = res.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Suscriptores" value={String(s.live)} hint="reciben café" />
        <Kpi
          label="Ingreso mensual"
          value={formatCop(s.mrrCents)}
          hint={`${formatCop(s.avgRevenuePerSubCents)} por suscriptor`}
        />
        <Kpi
          label="Churn"
          value={formatPct(s.churnPct)}
          hint={`${s.cancelledInRange} bajas · ${s.newInRange} altas`}
        />
        <Kpi
          label="Pago fallido"
          value={String(s.counts.PAYMENT_FAILED)}
          hint={s.counts.PAYMENT_FAILED > 0 ? "requieren seguimiento" : "todo al día"}
        />
      </section>

      <Panel
        title="Altas y bajas"
        description="La fecha de baja es aproximada (última actualización de la suscripción cancelada)."
      >
        <ColumnChart
          title="Altas y bajas de suscripciones"
          data={s.series.map((p) => ({ date: p.date, values: [p.new, p.cancelled] }))}
          series={[
            { name: "Altas", color: PALETTE.blue },
            { name: "Bajas", color: PALETTE.orange },
          ]}
          format="count"
          granularity={s.range.granularity}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Frecuencia de envío" description="Suscripciones que reciben café hoy.">
          <BarList
            items={s.frequencies.map((fq) => ({
              label: fq.days === 7 ? "Semanal" : fq.days === 14 ? "Quincenal" : fq.days === 30 ? "Mensual" : `Cada ${fq.days} días`,
              value: fq.count,
              display: String(fq.count),
            }))}
            empty="Aún no hay suscriptores."
          />
        </Panel>
        <Panel title="Estado actual">
          <ul className="divide-y divide-border text-sm">
            {Object.entries(SUB_STATUS).map(([k, label]) => (
              <li key={k} className="flex justify-between py-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums font-medium">
                  {s.counts[k as keyof typeof s.counts] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Productos ────────────────────────────────────────────────────────────────

async function ProductsTab({ range }: { range: RangeParams }) {
  const res = await getProductAnalytics(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const p = res.data;
  const units = (n: number) => `${n} ${n === 1 ? "unidad" : "unidades"}`;
  const inventory = p.inventory.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Más vendidos" description="Por ingresos en el periodo." className="lg:col-span-2">
          <BarList
            items={p.top.map((t) => ({
              label: t.product,
              value: t.revenueCents,
              display: formatCop(t.revenueCents),
              sub: units(t.units),
            }))}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="Molienda">
            <BarList
              items={p.grindMix.map((g) => ({
                label: GRIND_LABEL[g.key] ?? g.key,
                value: g.units,
                display: units(g.units),
              }))}
            />
          </Panel>
          <Panel title="Tamaño">
            <BarList
              items={p.sizeMix
                .filter((sz) => Number(sz.key) > 0)
                .map((sz) => ({
                  label: formatGrams(Number(sz.key)),
                  value: sz.units,
                  display: units(sz.units),
                }))}
            />
          </Panel>
        </div>
      </div>

      <Panel
        title="Días de inventario"
        description="Stock dividido por lo que se vendió al día en los últimos 30 días. Primero lo que se agota antes."
      >
        {inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay productos publicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Stock</th>
                  <th className="pb-2 text-right font-medium">Venta diaria</th>
                  <th className="pb-2 text-right font-medium">Alcanza para</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((v) => (
                  <tr key={v.variantId}>
                    <td className="py-2">
                      {v.product}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {v.isAccessory ? "Accesorio" : `${formatGrams(v.sizeGrams)} · ${GRIND_LABEL[v.grind] ?? v.grind}`}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{v.stock}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {v.unitsPerDay > 0 ? v.unitsPerDay.toLocaleString("es-CO") : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {v.daysLeft === null ? (
                        <span className="text-xs text-muted-foreground">sin ventas</span>
                      ) : v.daysLeft < 7 ? (
                        <StatusPill level="risk">{v.daysLeft} días</StatusPill>
                      ) : v.daysLeft < 21 ? (
                        <StatusPill level="attention">{v.daysLeft} días</StatusPill>
                      ) : (
                        <span className="tabular-nums">{v.daysLeft} días</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {p.ratings.length > 0 && (
        <Panel title="Calificaciones" description="Reseñas aprobadas.">
          <BarList
            items={p.ratings.slice(0, 8).map((r) => ({
              label: r.product,
              value: r.avg,
              display: `${r.avg.toLocaleString("es-CO")} / 5`,
              sub: `${r.count} reseña${r.count === 1 ? "" : "s"}`,
            }))}
          />
        </Panel>
      )}
    </div>
  );
}

// ── Clientes ─────────────────────────────────────────────────────────────────

async function CustomersTab({ range, advanced }: { range: RangeParams; advanced: boolean }) {
  const res = await getCustomerAnalytics(range);
  if (!res.ok) return <LoadError status={res.status} />;
  const c = res.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Compradores"
          value={String(c.buyersInRange)}
          hint={`${c.newCustomers} nuevos · ${c.returningCustomers} recurrentes`}
        />
        <Kpi label="Recompra" value={formatPct(c.repeatRatePct)} hint="clientes con 2 o más pedidos" />
        <Kpi label="Valor por cliente" value={formatCop(c.avgLifetimeValueCents)} hint="gasto histórico promedio" />
        <Kpi
          label="Boletín"
          value={String(c.newsletter.active)}
          hint={`+${c.newsletter.joined} · −${c.newsletter.left} en el periodo`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mejores clientes" description="Por gasto en el periodo.">
          <BarList
            items={c.top.map((t) => ({
              key: t.customerId,
              label: t.name,
              value: t.cents,
              display: formatCop(t.cents),
              sub: `${t.orders} pedido${t.orders === 1 ? "" : "s"}`,
            }))}
          />
        </Panel>

        <Panel
          title="Clientes en riesgo"
          description="Compraban con regularidad, no tienen suscripción y llevan más del doble de su intervalo habitual sin volver."
        >
          {!advanced || c.atRisk === null ? (
            <p className="text-sm text-muted-foreground">{UPGRADE_ADVANCED}</p>
          ) : c.atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nadie en riesgo por ahora.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {c.atRisk.map((r) => (
                <li key={r.customerId} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.email} · compraba cada {r.usualIntervalDays} días
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill level={r.daysSinceLastOrder > 3 * r.usualIntervalDays ? "risk" : "attention"}>
                      hace {r.daysSinceLastOrder} días
                    </StatusPill>
                    <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {formatCop(r.lifetimeCents)} en {r.orders} pedidos
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Plan de tueste ───────────────────────────────────────────────────────────

async function RoastTab({ advanced }: { advanced: boolean }) {
  if (!advanced) {
    return <LockedState title="Plan de tueste" body={UPGRADE_ADVANCED} />;
  }
  const res = await getRoastPlan();
  if (!res.ok) return <LoadError status={res.status} />;
  const r = res.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Próximos 7 días" value={formatGrams(r.totals.grams7)} hint="café a despachar" />
        <Kpi label="Próximos 14 días" value={formatGrams(r.totals.grams14)} hint="café a despachar" />
        <Kpi label="Pedidos por preparar" value={formatGrams(r.totals.openOrderGrams)} hint="ya recibidos, sin enviar" />
      </section>
      <Panel
        title="Qué tostar"
        description="Envíos programados de suscripciones más pedidos recibidos o en preparación, por café y molienda."
      >
        {r.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay envíos programados en las próximas dos semanas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Café</th>
                  <th className="pb-2 font-medium">Molienda</th>
                  <th className="pb-2 text-right font-medium">7 días</th>
                  <th className="pb-2 text-right font-medium">14 días</th>
                  <th className="pb-2 text-right font-medium">Envíos de suscripción (14 d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {r.lines.map((l) => (
                  <tr key={`${l.product}-${l.grind}`}>
                    <td className="py-2 font-medium">{l.product}</td>
                    <td className="py-2 text-muted-foreground">{GRIND_LABEL[l.grind] ?? l.grind}</td>
                    <td className="py-2 text-right tabular-nums">{formatGrams(l.grams7)}</td>
                    <td className="py-2 text-right tabular-nums">{formatGrams(l.grams14)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{l.shipments14}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
