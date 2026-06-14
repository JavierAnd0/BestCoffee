import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Package, AlertTriangle, Settings2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Logística · Admin" };

interface Carrier {
  id: string;
  name: string;
  active: boolean;
  pendingShipments: number;
  avgDeliveryDays: string;
  accountId: string;
}

interface ShippingZone {
  zone: string;
  label: string;
  rateCents: number | null;
  freeAboveCents: number | null;
  active: boolean;
}

interface PendingDispatch {
  id: string;
  customer: string;
  carrier: string;
  items: number;
  paidAt: string;
}

const CARRIERS: Carrier[] = [
  { id: "servientrega", name: "Servientrega", active: true, pendingShipments: 14, avgDeliveryDays: "1–2 días", accountId: "SRV-49201" },
  { id: "tcc", name: "TCC", active: true, pendingShipments: 6, avgDeliveryDays: "2–3 días", accountId: "TCC-10483" },
  { id: "coordinadora", name: "Coordinadora", active: false, pendingShipments: 0, avgDeliveryDays: "2–4 días", accountId: "CRD-00291" },
];

const ZONES: ShippingZone[] = [
  { zone: "bog", label: "Bogotá D.C.", rateCents: 6_000_00, freeAboveCents: 45_000_00, active: true },
  { zone: "med", label: "Medellín y Área Metro", rateCents: 8_000_00, freeAboveCents: 45_000_00, active: true },
  { zone: "cal", label: "Cali y Eje Cafetero", rateCents: 9_500_00, freeAboveCents: 60_000_00, active: true },
  { zone: "coast", label: "Costa Atlántica", rateCents: 12_000_00, freeAboveCents: 80_000_00, active: true },
  { zone: "other", label: "Resto del país", rateCents: 14_000_00, freeAboveCents: null, active: true },
  { zone: "intl", label: "Internacional", rateCents: null, freeAboveCents: null, active: false },
];

const PENDING: PendingDispatch[] = [
  { id: "ORG-10428", customer: "María Restrepo", carrier: "Servientrega", items: 3, paidAt: "hace 12 min" },
  { id: "ORG-10427", customer: "Andrés Pérez", carrier: "TCC", items: 1, paidAt: "hace 38 min" },
  { id: "ORG-10426", customer: "Clara Torres", carrier: "Servientrega", items: 2, paidAt: "hace 1 h" },
  { id: "ORG-10425", customer: "Jorge Camargo", carrier: "Servientrega", items: 1, paidAt: "hace 2 h" },
  { id: "ORG-10424", customer: "Lina Mejía", carrier: "TCC", items: 2, paidAt: "hace 3 h" },
];

const KPIS = [
  { label: "Pendientes de despacho", value: "20", icon: Package, tone: "text-amber-600" },
  { label: "Enviados hoy", value: "18", icon: Truck, tone: "text-foreground" },
  { label: "Transportistas activos", value: "2", icon: Truck, tone: "text-foreground" },
  { label: "Incidencias abiertas", value: "1", icon: AlertTriangle, tone: "text-red-600" },
] as const;

export default function LogisticsPage() {
  return (
    <div>
      <PageHeader
        title="Logística"
        description="Transportistas, zonas de envío y pedidos pendientes de despacho."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="size-4" />
            Configuración
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPIS.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-lg border border-border bg-background p-4">
            <Icon className={`size-4 mb-2 ${tone}`} />
            <div className="text-2xl font-display font-semibold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Carriers */}
        <section className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-medium">Transportistas</h2>
            <Button variant="outline" size="sm">+ Agregar</Button>
          </div>
          <ul className="divide-y divide-border">
            {CARRIERS.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className={
                  "size-9 rounded-full bg-muted grid place-items-center text-[10px] font-bold shrink-0 " +
                  (c.active ? "opacity-100" : "opacity-40")
                }>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    <Badge
                      variant="outline"
                      className={c.active
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"}
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.accountId} · {c.avgDeliveryDays}
                    {c.active && c.pendingShipments > 0 && ` · ${c.pendingShipments} pendientes`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0">
                  <ExternalLink className="size-3" />
                  Portal
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Zones */}
        <section className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-medium">Zonas y tarifas</h2>
            <Button variant="outline" size="sm">Editar zonas</Button>
          </div>
          <ul className="divide-y divide-border">
            {ZONES.map((z) => (
              <li
                key={z.zone}
                className={"flex items-center gap-4 px-5 py-3 " + (!z.active ? "opacity-40" : "")}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{z.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {z.active && z.rateCents
                      ? `${formatCop(z.rateCents)} · Gratis desde ${z.freeAboveCents ? formatCop(z.freeAboveCents) : "—"}`
                      : z.active
                      ? "Sin tarifa configurada"
                      : "Desactivada"}
                  </div>
                </div>
                {!z.active && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    Desactivada
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Pending dispatch */}
      <section className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-medium">Pendientes de despacho</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PENDING.length} pedidos listos · ordenados por antigüedad
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Truck className="size-4" />
            Generar guías
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left">
                {["Pedido", "Cliente", "Transportista", "Artículos", "Pagado", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PENDING.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="font-mono text-xs font-medium hover:text-accent transition-colors"
                    >
                      {p.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.carrier}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{p.items}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.paidAt}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm">Despachar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
