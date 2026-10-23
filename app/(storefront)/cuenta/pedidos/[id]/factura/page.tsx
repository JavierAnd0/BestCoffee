import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Coffee, ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCustomerOrder, getCurrentCustomer } from "@/lib/data/account";
import { getCurrentTenant } from "@/lib/data/tenant";
import { formatCop, formatOrderCode } from "@/lib/format";
import { InvoiceActions } from "@/components/storefront/invoice-print-button";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Factura de Venta — #${formatOrderCode(id)}` };
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const [order, customer, tenant] = await Promise.all([
    getCustomerOrder(id),
    getCurrentCustomer(),
    getCurrentTenant(),
  ]);

  if (!order) notFound();

  const invoiceNumber = `FAC-${formatOrderCode(order.id)}`;
  const items = order.items?.length
    ? order.items
    : [
        {
          name: "Café de Especialidad ORÍGEN",
          variant: "250 g · Grano Entero",
          qty: order.itemsCount,
          priceCents: order.totalCents,
        },
      ];

  const subtotal = order.subtotalCents ?? items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  const total = order.totalCents;
  const shippingCents = order.shippingCents ?? Math.max(0, total - subtotal);
  const discountCents = order.discountCents ?? 0;

  return (
    <div className="mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Barra superior de acciones (oculta al imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden border-b border-border pb-4">
        <Link
          href={`/cuenta/pedidos/${order.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Volver al detalle del pedido
        </Link>
        <InvoiceActions />
      </div>

      {/* Hoja de Factura */}
      <div className="rounded-xl border border-border bg-card p-8 sm:p-12 shadow-sm text-foreground space-y-10 print:border-none print:shadow-none print:p-0">
        {/* Cabecera de la empresa y número de factura */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 border-b border-border pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-bold text-lg">
                <Coffee className="size-5" />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight uppercase">
                {tenant.name || "ORÍGEN Café"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              <strong>ORÍGEN Café S.A.S.</strong><br />
              NIT: 900.123.456-7 · Régimen Responsable de IVA<br />
              Cra 13 #57-32, Chapinero · Bogotá D.C., Colombia<br />
              contacto@cafeorigen.co · Tel: +57 (601) 745-9823
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <Eyebrow>Factura de Venta Electrónica</Eyebrow>
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {invoiceNumber}
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              <strong>Fecha de emisión:</strong> {order.createdAt}<br />
              <strong>Referencia de pedido:</strong>{" "}
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <ShieldCheck className="size-3" />
                Pago Confirmado
              </span>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Envío */}
        <div className="grid sm:grid-cols-2 gap-6 text-xs bg-muted/30 p-5 rounded-lg border border-border/60">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Facturado a (Cliente)
            </div>
            <div className="font-semibold text-sm text-foreground">
              {customer.name || "Cliente Registrado"}
            </div>
            <div className="text-muted-foreground mt-0.5">
              {customer.email || "cliente@ejemplo.com"}
            </div>
            {customer.phone && (
              <div className="text-muted-foreground">Tel: {customer.phone}</div>
            )}
            <div className="text-muted-foreground">Tipo de cliente: Consumidor final</div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Dirección de Entrega
            </div>
            <div className="text-foreground font-medium">
              {order.shippingAddress || "Dirección principal registrada"}
            </div>
            <div className="text-muted-foreground mt-0.5">Colombia</div>
            <div className="text-muted-foreground">
              Método de despacho: Envío express nacional garantizado
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Comprados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[11px]">
                <th className="py-3 font-semibold">Descripción del Producto</th>
                <th className="py-3 font-semibold text-center w-20">Cant.</th>
                <th className="py-3 font-semibold text-right w-32">Precio Unitario</th>
                <th className="py-3 font-semibold text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-foreground text-sm">
                      {it.name}
                    </div>
                    {it.variant && (
                      <div className="text-muted-foreground text-xs">
                        {it.variant}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 text-center tabular-nums text-foreground font-medium">
                    {it.qty}
                  </td>
                  <td className="py-3.5 text-right tabular-nums text-muted-foreground">
                    {formatCop(it.priceCents)}
                  </td>
                  <td className="py-3.5 text-right tabular-nums font-semibold text-foreground">
                    {formatCop(it.priceCents * it.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de Totales e Impuestos */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground max-w-sm space-y-1.5">
            <div className="font-semibold text-foreground">Notas Fiscales & Garantía:</div>
            <p>
              Café tostado en grano o molido empacado en origen. Exento / gravado según Estatuto Tributario colombiano vigente.
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Esta factura electrónica es título valor conforme a la ley 1231 de 2008.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal productos:</span>
              <span className="tabular-nums font-medium text-foreground">
                {formatCop(subtotal)}
              </span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuento aplicado:</span>
                <span className="tabular-nums font-medium">
                  -{formatCop(discountCents)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Costo de envío:</span>
              <span className="tabular-nums font-medium text-foreground">
                {shippingCents === 0 ? "Gratis ($0)" : formatCop(shippingCents)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA incluido (19% s.a.):</span>
              <span className="tabular-nums font-medium text-muted-foreground">
                {formatCop(Math.round(total * 0.19 / 1.19))}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-border pt-3 text-foreground">
              <span>Total Facturado:</span>
              <span className="text-lg tabular-nums font-display font-bold">
                {formatCop(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Pie de página de la factura */}
        <div className="text-center pt-8 border-t border-border/60 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            ¡Gracias por apoyar el café de especialidad colombiano con {tenant.name || "ORÍGEN"}!
          </p>
          <p className="text-[11px]">
            Para soporte o dudas sobre tu facturación, escríbenos a{" "}
            <a href="mailto:soporte@cafeorigen.co" className="underline hover:text-foreground">
              soporte@cafeorigen.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

