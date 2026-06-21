import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { platformFetch } from "@/lib/api/platform";
import { BillingBadge, type BillingStatus } from "@/components/platform/billing-badge";

export const metadata: Metadata = { title: "Tenants · Superadmin" };

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  tier: "STARTER" | "PRO" | "BUSINESS";
  createdAt: string;
  billingStatus: BillingStatus;
  _count: { memberships: number; orders: number; customers: number };
}

const TIER_TONE: Record<TenantRow["tier"], string> = {
  STARTER: "bg-muted text-muted-foreground border-border",
  PRO: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  BUSINESS: "bg-violet-500/10 text-violet-700 border-violet-500/20",
};

export default async function TenantsPage() {
  const tenants = await platformFetch<TenantRow[]>("/v1/platform/tenants");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tenants.length} {tenants.length === 1 ? "cafetería" : "cafeterías"} registradas
          </p>
        </div>
        <Button render={<Link href="/platform/superadmin/tenants/new"><Plus className="size-4 mr-1.5" />Nuevo tenant</Link>} />
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Facturación</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Miembros</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pedidos</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Clientes</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3">
                  <Badge className={TIER_TONE[t.tier]}>{t.tier}</Badge>
                </td>
                <td className="px-4 py-3">
                  <BillingBadge status={t.billingStatus} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{t._count.memberships}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t._count.orders}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t._count.customers}</td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                  {new Date(t.createdAt).toLocaleDateString("es-CO")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/platform/superadmin/tenants/${t.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No hay tenants todavía.{" "}
                  <Link href="/platform/superadmin/tenants/new" className="text-primary hover:underline">
                    Crear el primero
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
