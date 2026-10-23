import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminOrders } from "@/lib/data/admin";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos · Admin" };

const STATUS_TONE: Record<OrderStatus, string> = {
  PROCESSING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: "Todos" },
  { label: "Procesando", value: "PROCESSING" },
  { label: "Enviado", value: "SHIPPED" },
  { label: "Entregado", value: "DELIVERED" },
  { label: "Cancelado", value: "CANCELLED" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ status, q }, allOrders] = await Promise.all([
    searchParams,
    listAdminOrders(),
  ]);

  const query = q?.trim().toLowerCase() ?? "";
  const activeStatus = FILTERS.some((f) => f.value === status)
    ? (status as OrderStatus)
    : undefined;

  const rows = allOrders.filter((o) => {
    if (activeStatus && o.status !== activeStatus) return false;
    if (query) {
      return (
        String(o.id ?? "").toLowerCase().includes(query) ||
        String(o.customer ?? "").toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description={`${rows.length} pedidos en los últimos 30 días`}
        actions={
          <form method="GET" className="relative">
            {activeStatus && (
              <input type="hidden" name="status" value={activeStatus} />
            )}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar # pedido o cliente..."
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-64 outline-none focus-visible:border-foreground/40"
            />
          </form>
        }
      />

      <div className="flex gap-2 text-xs">
        {FILTERS.map((f) => {
          const isCurrent = f.value === activeStatus;
          const params = new URLSearchParams();
          if (f.value) params.set("status", f.value);
          if (q) params.set("q", q);
          const href = params.toString()
            ? `/admin/pedidos?${params.toString()}`
            : "/admin/pedidos";
          return (
            <Link
              key={f.label}
              href={href}
              className={
                "rounded-md px-3 py-1.5 transition-colors " +
                (isCurrent
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {f.label}
            </Link>
          );
        })}
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
                  <Badge variant="outline" className={STATUS_TONE[o.status] ?? "bg-muted text-muted-foreground border-border"}>
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.createdAt}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No se encontraron pedidos con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
