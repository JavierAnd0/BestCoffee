import Link from "next/link";
import type { Metadata } from "next";
import { Store, Users, ShoppingBag, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { platformFetch } from "@/lib/api/platform";

export const metadata: Metadata = { title: "Dashboard · Superadmin" };

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  tier: "STARTER" | "PRO" | "BUSINESS";
  createdAt: string;
  _count: { memberships: number; orders: number; customers: number };
}

const TIER_TONE: Record<TenantRow["tier"], string> = {
  STARTER: "bg-muted text-muted-foreground border-border",
  PRO: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  BUSINESS: "bg-violet-500/10 text-violet-700 border-violet-500/20",
};

export default async function SuperadminDashboard() {
  const tenants = await platformFetch<TenantRow[]>("/v1/platform/tenants");

  const totals = tenants.reduce(
    (acc, t) => {
      acc.orders += t._count.orders;
      acc.customers += t._count.customers;
      acc.byTier[t.tier] += 1;
      return acc;
    },
    {
      orders: 0,
      customers: 0,
      byTier: { STARTER: 0, PRO: 0, BUSINESS: 0 } as Record<TenantRow["tier"], number>,
    },
  );

  const recent = [...tenants]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
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
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Store} label="Tiendas" value={tenants.length} />
        <StatCard icon={Users} label="Clientes totales" value={totals.customers} />
        <StatCard icon={ShoppingBag} label="Pedidos totales" value={totals.orders} />
      </div>

      {/* Distribución por tier */}
      <div className="rounded-lg border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Distribución por plan
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {(["STARTER", "PRO", "BUSINESS"] as TenantRow["tier"][]).map((t) => (
            <div key={t} className="rounded-md border border-border p-4 text-center">
              <Badge className={TIER_TONE[t]}>{t}</Badge>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {totals.byTier[t]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenants recientes */}
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Altas recientes
          </h2>
          <Link
            href="/platform/superadmin/tenants"
            className="text-xs text-primary hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Aún no hay tenants.{" "}
              <Link href="/platform/superadmin/tenants/new" className="text-primary hover:underline">
                Crear el primero
              </Link>
            </p>
          ) : (
            recent.map((t) => (
              <Link
                key={t.id}
                href={`/platform/superadmin/tenants/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{t.slug}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Badge className={TIER_TONE[t.tier]}>{t.tier}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums w-24 text-right">
                    {new Date(t.createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-[11px] uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
