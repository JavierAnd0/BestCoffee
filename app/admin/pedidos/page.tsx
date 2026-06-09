import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { getRecentOrders } from "@/lib/data/admin";
import { getCustomerOrders } from "@/lib/data/account";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos · Admin" };

const STATUS_TONE: Record<OrderStatus, string> = {
  PROCESSING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export default async function AdminOrdersPage() {
  const [recent, customerOrders] = await Promise.all([getRecentOrders(), getCustomerOrders()]);
  // Compose a richer mock list by merging admin recent orders with customer orders.
  const rows = [
    ...recent.map((o) => ({
      id: o.id,
      customer: o.customer,
      totalCents: o.totalCents,
      status: o.status as OrderStatus,
      createdAt: o.createdAt,
      fromSub: false,
    })),
    ...customerOrders.map((o) => ({
      id: o.id,
      customer: "María Restrepo",
      totalCents: o.totalCents,
      status: o.status,
      createdAt: o.createdAt,
      fromSub: o.fromSubscription,
    })),
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description={`${rows.length} pedidos en los últimos 30 días`}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder="Buscar #ORG-..."
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-64 outline-none focus-visible:border-foreground/40"
            />
          </div>
        }
      />

      <div className="flex gap-2 text-xs">
        {["Todos", "Procesando", "Enviado", "Entregado", "Cancelado"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-md px-3 py-1.5 transition-colors " +
              (i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Origen</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-medium hover:underline underline-offset-2"
                  >
                    #{o.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.fromSub ? "Suscripción" : "Compra directa"}
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {formatCop(o.totalCents)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_TONE[o.status]}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
