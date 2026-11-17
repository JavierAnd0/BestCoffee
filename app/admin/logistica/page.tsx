import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Package, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { formatCop } from "@/lib/format";
import { getLogisticsData, type LogisticsOrder } from "@/lib/data/admin-logistics";

export const metadata: Metadata = { title: "Logística · Admin" };

const STATUS_LABEL: Record<LogisticsOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function ago(iso?: string): string {
  if (!iso) return "—";
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

function shortId(id: string): string {
  return id.slice(-8).toUpperCase();
}

function safeUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function OrderLink({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/pedidos/${id}`}
      className="font-mono text-xs font-medium hover:text-accent transition-colors"
    >
      #{shortId(id)}
    </Link>
  );
}

const TH = "px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap";

export default async function LogisticsPage() {
  const data = await getLogisticsData();

  const kpis = [
    { label: "Pagados por despachar", value: data.toDispatch.length, icon: Package, tone: "text-amber-600" },
    { label: "En camino", value: data.shippedTotal, icon: Truck, tone: "text-foreground" },
    { label: "Esperando pago", value: data.awaitingPayment, icon: Clock, tone: "text-muted-foreground" },
  ];

  return (
    <div>
      <PageHeader
        title="Logística"
        description="Pedidos pagados pendientes de despacho y pedidos en camino. El despacho y la guía se registran en el detalle de cada pedido."
      />

      {data.error && (
        <div className="mb-6 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar los pedidos: {data.error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-lg border border-border bg-background p-4">
            <Icon className={`size-4 mb-2 ${tone}`} />
            <div className="text-2xl font-display font-semibold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-background mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium">Pendientes de despacho</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pagados y sin enviar · del más antiguo al más reciente
            {data.awaitingPayment > 0 &&
              ` · ${data.awaitingPayment} ${data.awaitingPayment === 1 ? "pedido espera" : "pedidos esperan"} el pago y no aparecen aquí hasta marcarse como pagados`}
          </p>
        </div>
        {data.toDispatch.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground text-center">
            No hay pedidos pagados pendientes de despacho.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  {["Pedido", "Cliente", "Ciudad", "Artículos", "Total", "Estado", "Recibido"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.toDispatch.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3"><OrderLink id={o.id} /></td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.city ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{o.items}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCop(o.totalCents)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-normal">{STATUS_LABEL[o.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ago(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-background">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium">En camino</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pedidos despachados, con su enlace de seguimiento cuando se registró
            {data.shippedTotal > data.shipped.length && " · se muestran los 50 más recientes"}
          </p>
        </div>
        {data.shipped.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground text-center">
            No hay pedidos en camino.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  {["Pedido", "Cliente", "Ciudad", "Seguimiento", "Actualizado"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.shipped.map((o) => {
                  const tracking = safeUrl(o.trackingUrl);
                  return (
                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3"><OrderLink id={o.id} /></td>
                      <td className="px-4 py-3">{o.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.city ?? "—"}</td>
                      <td className="px-4 py-3">
                        {tracking ? (
                          <a
                            href={tracking}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs hover:text-accent"
                          >
                            Ver guía
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin enlace</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {ago(o.updatedAt ?? o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.truncated && (
        <p className="mt-4 text-xs text-muted-foreground">
          Hay más pedidos de los que se cargaron en esta vista; revisa el listado de pedidos.
        </p>
      )}
    </div>
  );
}
