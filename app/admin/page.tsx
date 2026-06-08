import Link from "next/link";
import type { Metadata } from "next";
import { TrendingUp, TrendingDown, AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesChart } from "@/components/admin/sales-chart";
import {
  ADMIN_KPIS,
  ADMIN_ALERTS,
  ADMIN_RECENT_ORDERS,
  SALES_LAST_14D,
} from "@/lib/mocks/admin";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard · Admin" };

const STATUS_LABEL = {
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
} as const;

const SEVERITY_ICON = {
  danger: OctagonAlert,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_TONE = {
  danger: "text-destructive bg-destructive/5 border-destructive/20",
  warning: "text-amber-700 bg-amber-500/5 border-amber-500/20",
  info: "text-foreground bg-muted border-border",
} as const;

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vista general de ORÍGEN. Datos en tiempo real.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Hoy · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ADMIN_KPIS.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-background p-5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight">
              {k.value}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{k.hint}</span>
              {k.delta && (
                <span
                  className={
                    "inline-flex items-center gap-0.5 font-medium " +
                    (k.delta.positive ? "text-emerald-700" : "text-destructive")
                  }
                >
                  {k.delta.positive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {k.delta.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold">Ventas · últimos 14 días</h2>
            <div className="flex gap-2 text-xs">
              {["14 d", "30 d", "90 d"].map((p, i) => (
                <button
                  key={p}
                  className={
                    "rounded-md px-2.5 py-1 transition-colors " +
                    (i === 0
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={SALES_LAST_14D} />
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Alertas</h2>
          <div className="space-y-3">
            {ADMIN_ALERTS.map((a) => {
              const Icon = SEVERITY_ICON[a.severity];
              return (
                <article
                  key={a.id}
                  className={"rounded-md border p-3 " + SEVERITY_TONE[a.severity]}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="size-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-medium">{a.title}</div>
                      <div className="opacity-80 mt-0.5">{a.body}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-lg font-semibold">Pedidos recientes</h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/admin/pedidos">Ver todos →</Link>}
          />
        </div>
        <div className="divide-y divide-border">
          {ADMIN_RECENT_ORDERS.map((o) => (
            <Link
              key={o.id}
              href={`/admin/pedidos/${o.id}`}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-center px-6 py-4 hover:bg-muted/40 transition-colors"
            >
              <span className="font-medium text-sm">#{o.id}</span>
              <span className="text-sm">{o.customer}</span>
              <Badge variant="outline">{STATUS_LABEL[o.status]}</Badge>
              <span className="text-sm font-semibold tabular-nums">
                {formatCop(o.totalCents)}
              </span>
              <span className="text-xs text-muted-foreground">{o.createdAt}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
