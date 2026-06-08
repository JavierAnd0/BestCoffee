import Link from "next/link";
import type { Metadata } from "next";
import { Truck, MapPin, CreditCard, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { formatCop } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pedido #${id} · Admin` };
}

const STATUSES = ["RECEIVED", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
};

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pedidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a pedidos
      </Link>
      <PageHeader
        title={`Pedido #${id}`}
        description="04 jun 2026 · 14:23 · Compra directa"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Imprimir guía
            </Button>
            <Button size="sm">Marcar como enviado</Button>
          </div>
        }
      />

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Estado del pedido</h2>
        <div className="flex items-center justify-between gap-2">
          {STATUSES.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div
                className={
                  "size-8 rounded-full grid place-items-center text-xs font-semibold " +
                  (i <= 1
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground")
                }
              >
                {i + 1}
              </div>
              <span className="mt-2 text-xs text-center">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-lg border border-border bg-background">
          <header className="p-5 border-b border-border">
            <h2 className="font-display text-lg font-semibold">Productos</h2>
          </header>
          <div className="divide-y divide-border">
            {[
              { name: "Etiopía Guji", variant: "340 g · Grano · Suscripción c/2 sem", qty: 1, totalCents: 61_200_00 },
              { name: "Mezcla del alba", variant: "250 g · Molido filtro", qty: 2, totalCents: 116_000_00 },
            ].map((it, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <span className="size-14 rounded-md bg-muted" aria-hidden />
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.variant}</div>
                  <div className="text-xs text-muted-foreground mt-1">Cantidad: {it.qty}</div>
                </div>
                <span className="font-semibold tabular-nums">{formatCop(it.totalCents)}</span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-border space-y-2 text-sm">
            <Row label="Subtotal" value={formatCop(177_200_00)} />
            <Row label="Envío" value="Gratis" />
            <Row label="Descuento suscr." value={`–${formatCop(9_180_00)}`} />
            <Row label="Total" value={formatCop(168_020_00)} bold />
          </div>
        </section>

        <aside className="space-y-4">
          <Card icon={<User className="size-4" />} title="Cliente">
            <div className="text-sm font-medium">María Restrepo</div>
            <div className="text-xs text-muted-foreground">maria@correo.com</div>
            <div className="text-xs text-muted-foreground">+57 300 123 4567</div>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Ver perfil
            </Button>
          </Card>
          <Card icon={<MapPin className="size-4" />} title="Envío">
            <div className="text-sm">Cra 12 #34-56</div>
            <div className="text-sm text-muted-foreground">Bogotá, Cundinamarca</div>
            <input
              placeholder="Número de guía"
              className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            />
          </Card>
          <Card icon={<CreditCard className="size-4" />} title="Pago">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
              Pagado
            </Badge>
            <div className="mt-2 text-xs text-muted-foreground">
              Stripe · Visa terminada en 4242
            </div>
          </Card>
          <Card icon={<Truck className="size-4" />} title="Notas internas">
            <textarea
              rows={3}
              placeholder="Notas privadas del pedido…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-y"
            />
            <Button size="sm" className="mt-2 w-full justify-center">
              Guardar nota
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={"tabular-nums " + (bold ? "font-display text-lg font-semibold" : "")}>
        {value}
      </span>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
