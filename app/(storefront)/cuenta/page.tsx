import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_CUSTOMER,
  MOCK_ORDERS,
  MOCK_SUBSCRIPTIONS,
  ORDER_STATUS_LABEL,
} from "@/lib/mocks/account";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function AccountHome() {
  const activeSubs = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "ACTIVE");
  const last = MOCK_ORDERS[0];

  return (
    <div className="space-y-12">
      <header>
        <Eyebrow>Tu cuenta</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Hola, {MOCK_CUSTOMER.name.split(" ")[0]}
        </h1>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <Stat label="Suscripciones activas" value={String(activeSubs.length)} />
        <Stat label="Pedidos totales" value={String(MOCK_ORDERS.length)} />
        <Stat
          label="Próximo envío"
          value={activeSubs[0]?.nextShipAt ?? "—"}
          hint={activeSubs[0] ? `en ${activeSubs[0].daysUntilNext} días` : undefined}
        />
      </section>

      <section className="rounded-lg border border-border bg-background p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Tu último pedido</h2>
          <Link
            href="/cuenta/pedidos"
            className="text-sm underline-offset-2 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-md bg-muted" aria-hidden />
          <div className="flex-1">
            <div className="font-medium">#{last.id}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {last.createdAt} · {last.itemsCount} artículos
            </div>
          </div>
          <Badge variant="outline">{ORDER_STATUS_LABEL[last.status]}</Badge>
          <span className="font-semibold tabular-nums">{formatCop(last.totalCents)}</span>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold">Tus suscripciones</h2>
          <Link
            href="/cuenta/suscripciones"
            className="text-sm underline-offset-2 hover:underline"
          >
            Gestionar →
          </Link>
        </div>
        <div className="grid gap-3">
          {activeSubs.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
            >
              <div className="size-12 rounded-md bg-muted" aria-hidden />
              <div className="flex-1">
                <div className="font-medium">{s.productName}</div>
                <div className="text-xs text-muted-foreground">{s.variantLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Próximo
                </div>
                <div className="text-sm font-medium">{s.nextShipAt}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
