import type { Metadata } from "next";
import { Pause, SkipForward, Coffee, MoreHorizontal, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { SUB_STATUS_LABEL, type SubStatus } from "@/lib/mocks/account";
import { getCustomerSubscriptions } from "@/lib/data/account";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Suscripciones · Admin" };

const STATUS_TONE: Record<SubStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  PAUSED: "bg-muted text-muted-foreground border-border",
  PAYMENT_FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export default async function AdminSubscriptionsPage() {
  const baseSubs = await getCustomerSubscriptions();
  // Spread mock subs across "customers" so the admin list feels populated.
  const allSubs = [
    ...baseSubs.map((s) => ({ ...s, customer: "María Restrepo" })),
    ...baseSubs.map((s, i) => ({ ...s, id: s.id + "_b", customer: ["Andrés P.", "Clara T.", "Jorge C."][i % 3] })),
  ];
  const active = allSubs.filter((s) => s.status === "ACTIVE").length;
  const paused = allSubs.filter((s) => s.status === "PAUSED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suscripciones"
        description={`${active} activas · ${paused} pausadas · ${allSubs.length} totales`}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder="Buscar cliente o producto"
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-72 outline-none focus-visible:border-foreground/40"
            />
          </div>
        }
      />

      <section className="grid sm:grid-cols-4 gap-4">
        <Kpi label="Activas" value={String(active)} hint="ciclo normal" />
        <Kpi label="Pausadas" value={String(paused)} hint="esperando reactivación" />
        <Kpi label="Pago fallido" value="2" hint="reintentando" />
        <Kpi label="Churn 30 d" value="3.4%" hint="–0.8 pp vs mes ant." />
      </section>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Frecuencia</th>
              <th className="px-4 py-3 font-medium">Próximo envío</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Precio</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allSubs.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{s.customer}</td>
                <td className="px-4 py-3">
                  <div>{s.productName}</div>
                  <div className="text-xs text-muted-foreground">{s.variantLabel}</div>
                </td>
                <td className="px-4 py-3">cada {s.frequencyDays / 7} sem</td>
                <td className="px-4 py-3 text-sm">{s.nextShipAt}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_TONE[s.status]}>
                    {SUB_STATUS_LABEL[s.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatCop(s.unitPriceCents)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Saltar">
                      <SkipForward className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Pausar">
                      <Pause className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Cambiar producto">
                      <Coffee className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Más">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}
