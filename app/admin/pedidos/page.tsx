import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminOrders, type AdminPaymentStatus } from "@/lib/data/admin";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mocks/account";
import { formatCop, formatOrderCode } from "@/lib/format";

export const metadata: Metadata = { title: "Pedidos · Admin" };

const STATUS_TONE: Record<OrderStatus, string> = {
  PROCESSING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  SHIPPED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const PAYMENT_LABEL: Record<AdminPaymentStatus, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

// El pago va como punto + texto (secundario); el estado del pedido es la única píldora.
const PAYMENT_TONE: Record<AdminPaymentStatus, { dot: string; text: string }> = {
  PAID: { dot: "bg-emerald-600", text: "text-muted-foreground" },
  PENDING: { dot: "bg-amber-500", text: "text-amber-800 font-medium" },
  FAILED: { dot: "bg-destructive", text: "text-destructive font-medium" },
  REFUNDED: { dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
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
        formatOrderCode(String(o.id ?? "")).toLowerCase().includes(query.replace(/^#/, "")) ||
        String(o.customer ?? "").toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description={`${rows.length} ${rows.length === 1 ? "pedido" : "pedidos"} · ${allOrders.filter((o) => o.paymentStatus === "PENDING" && o.status !== "CANCELLED").length} por confirmar pago`}
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

      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="admin-th bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((o) => {
              const pay = PAYMENT_TONE[o.paymentStatus] ?? PAYMENT_TONE.REFUNDED;
              return (
                <tr key={o.id} className="group relative hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    {/* El enlace cubre toda la fila: se hace clic en cualquier parte. */}
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      title={String(o.id)}
                      className="font-semibold tabular-nums tracking-wide underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-[var(--accent)]"
                    >
                      {formatOrderCode(String(o.id))}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{o.customer}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.fromSub ? "Suscripción" : "Compra directa"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                    {formatCop(o.totalCents)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={"inline-flex items-center gap-2 " + pay.text}>
                      <span className={"size-1.5 rounded-full " + pay.dot} aria-hidden />
                      {PAYMENT_LABEL[o.paymentStatus] ?? o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant="outline"
                      className={STATUS_TONE[o.status] ?? "bg-muted text-muted-foreground border-border"}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {o.createdAt}
                  </td>
                </tr>
              );
            })}
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
