import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  listAllAdminSubscriptions,
  type AdminSubDisplayStatus,
} from "@/lib/data/admin-subscriptions";
import { formatCop } from "@/lib/format";
import { SubscriptionRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Suscripciones · Admin" };

const STATUS_LABEL: Record<AdminSubDisplayStatus, string> = {
  ACTIVE: "Activa",
  SKIPPED_NEXT: "Salta el próximo",
  PAUSED: "Pausada",
  AWAITING_FIRST_PAYMENT: "Esperando primer pago",
  PAYMENT_FAILED: "Pago fallido",
  CANCELLED: "Cancelada",
};

const STATUS_TONE: Record<AdminSubDisplayStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  SKIPPED_NEXT: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  PAUSED: "bg-muted text-muted-foreground border-border",
  AWAITING_FIRST_PAYMENT: "bg-amber-500/10 text-amber-800 border-amber-500/20",
  PAYMENT_FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const FILTERS: Array<{ key: string; label: string; match: AdminSubDisplayStatus[] }> = [
  { key: "vigentes", label: "Vigentes", match: ["ACTIVE", "SKIPPED_NEXT", "PAUSED", "AWAITING_FIRST_PAYMENT", "PAYMENT_FAILED"] },
  { key: "activas", label: "Activas", match: ["ACTIVE", "SKIPPED_NEXT"] },
  { key: "pausadas", label: "Pausadas", match: ["PAUSED"] },
  { key: "sin-pagar", label: "Esperando pago", match: ["AWAITING_FIRST_PAYMENT"] },
  { key: "canceladas", label: "Canceladas", match: ["CANCELLED"] },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const [{ q, estado }, { items: allSubs, error }] = await Promise.all([
    searchParams,
    listAllAdminSubscriptions(),
  ]);

  const filter = FILTERS.find((f) => f.key === estado) ?? FILTERS[0];
  const query = q?.trim().toLowerCase() ?? "";
  const filtered = allSubs.filter(
    (s) =>
      filter.match.includes(s.status) &&
      (!query ||
        s.customerName.toLowerCase().includes(query) ||
        s.customerEmail.toLowerCase().includes(query) ||
        s.productName.toLowerCase().includes(query)),
  );

  const count = (...st: AdminSubDisplayStatus[]) =>
    allSubs.filter((s) => st.includes(s.status)).length;
  const active = count("ACTIVE", "SKIPPED_NEXT");
  const paused = count("PAUSED");
  const awaiting = count("AWAITING_FIRST_PAYMENT");
  const cancelled = count("CANCELLED");

  const hrefFor = (key: string) => {
    const p = new URLSearchParams();
    if (key !== FILTERS[0].key) p.set("estado", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/admin/suscripciones?${s}` : "/admin/suscripciones";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suscripciones"
        description={`${active} activas · ${paused} pausadas · ${allSubs.length} en total`}
        actions={
          <form method="GET" className="relative">
            {estado && <input type="hidden" name="estado" value={estado} />}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar cliente o producto"
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-72 max-w-full outline-none focus-visible:border-foreground/40"
            />
          </form>
        }
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Kpi label="Activas" value={String(active)} hint="generan pedidos en su fecha" />
        <Kpi label="Pausadas" value={String(paused)} hint="sin envíos hasta reanudar" />
        <Kpi label="Esperando pago" value={String(awaiting)} hint="se activan al pagar su primer pedido" />
        <Kpi label="Canceladas" value={String(cancelled)} hint="historial" />
      </section>

      <p className="text-xs text-muted-foreground">
        Cada envío de una suscripción crea un pedido pendiente de pago en Pedidos, igual que un
        pedido normal: cóbralo por fuera y márcalo como pagado. Una suscripción nueva se activa al
        marcar como pagado su primer pedido.
      </p>

      <nav className="flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={hrefFor(f.key)}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (f.key === filter.key
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground/70 hover:border-foreground/40")
            }
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          No se pudieron cargar las suscripciones: {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Frecuencia</th>
              <th className="px-4 py-3 font-medium">Próximo envío</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Precio por envío</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.customerName}</div>
                  {s.customerEmail && s.customerEmail !== s.customerName && (
                    <div className="text-xs text-muted-foreground">{s.customerEmail}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{s.productName}</div>
                  <div className="text-xs text-muted-foreground">{s.variantLabel}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {s.frequencyDays % 7 === 0 ? `cada ${s.frequencyDays / 7} sem` : `cada ${s.frequencyDays} d`}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(s.nextShipAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_TONE[s.status]}>
                    {STATUS_LABEL[s.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                  {s.unitPriceCents === null ? "—" : formatCop(s.unitPriceCents)}
                  {s.discountPct > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      –{s.discountPct}% suscripción
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <SubscriptionRowActions
                    id={s.id}
                    status={s.status}
                    frequencyDays={s.frequencyDays}
                    customerName={s.customerName}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  {allSubs.length === 0
                    ? "Aún no hay suscripciones. Nacen cuando un cliente compra por suscripción en la tienda."
                    : "No hay suscripciones con este filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="admin-label">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}
