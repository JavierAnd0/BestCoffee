import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RotateCcw, ShieldCheck, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentTenant } from "@/lib/data/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: "Garantía y devoluciones",
    description: `Derecho de retracto, garantía legal y reversión del pago en las compras en ${tenant.brand}, según el Estatuto del Consumidor (Ley 1480 de 2011).`,
  };
}

// Texto general de la ley colombiana. No se citan plazos propios de la tienda:
// solo los que fija la norma.
const RIGHTS = [
  {
    icon: <RotateCcw className="size-5 text-primary" />,
    title: "Derecho de retracto",
    description:
      "En las compras a distancia (en línea) puedes retractarte dentro de los 5 días hábiles siguientes a la entrega del producto. Debes devolverlo en el mismo estado en que lo recibiste, y los costos de transporte de la devolución corren por tu cuenta. La ley excluye del retracto, entre otros, los bienes perecederos, los de uso personal y los hechos a la medida del comprador. Si el retracto procede, el dinero se reintegra en un plazo máximo de 30 días calendario.",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    title: "Garantía legal",
    description:
      "Todo producto tiene garantía de calidad, idoneidad y seguridad. Si llega defectuoso, no corresponde a lo que pediste o presenta una falla, puedes pedir su reparación, su cambio o la devolución del dinero. El término es el que informe la tienda o el fabricante; para productos perecederos, va hasta su fecha de vencimiento.",
  },
  {
    icon: <CreditCard className="size-5 text-primary" />,
    title: "Reversión del pago",
    description:
      "Si pagaste con tarjeta u otro medio electrónico y la compra fue fraudulenta, no la solicitaste, no recibiste el producto o este no corresponde a lo pedido o es defectuoso, puedes pedir que se reverse el pago. Presenta la queja a la tienda y la solicitud a la entidad emisora de tu medio de pago dentro de los 5 días hábiles siguientes a cuando conociste la operación o recibiste el producto.",
  },
];

export default async function DevolucionesPage() {
  const tenant = await getCurrentTenant();
  const email = tenant.branding.contactEmail?.trim() || null;
  const phone = tenant.branding.contactPhone?.trim() || null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-14 text-center max-w-2xl mx-auto">
        <Eyebrow>Tus derechos como comprador</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Garantía y devoluciones
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Las compras en {tenant.brand} se rigen por el Estatuto del Consumidor de Colombia (Ley
          1480 de 2011). Este es un resumen de lo que la ley te garantiza.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6 mb-16">
        {RIGHTS.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border bg-card p-6 text-card-foreground space-y-3"
          >
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center mb-4">
              {p.icon}
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight">{p.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{p.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-muted/30 p-8 max-w-3xl mx-auto mb-12 text-sm leading-relaxed space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold text-base">
          <AlertCircle className="size-5 text-primary" />
          <span>Cómo hacer una solicitud</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
          <li>Escríbenos indicando tu número de pedido y qué solicitas (retracto, garantía o reversión).</li>
          <li>Si el producto llegó dañado o no corresponde, adjunta fotos del producto y del empaque.</li>
          <li>Cuando el dinero se reintegra a una tarjeta, el tiempo en que se refleja depende de la entidad emisora.</li>
        </ul>
      </section>

      <div className="text-center py-6">
        <h2 className="font-display text-2xl font-semibold">¿Necesitas hacer una solicitud?</h2>
        {(email || phone) && (
          <p className="text-sm text-muted-foreground mt-2">
            {email && (
              <>
                Escríbenos a{" "}
                <a href={`mailto:${email}`} className="text-foreground underline underline-offset-2">
                  {email}
                </a>
              </>
            )}
            {email && phone && " o llámanos al "}
            {!email && phone && "Llámanos al "}
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-foreground underline underline-offset-2">
                {phone}
              </a>
            )}
            .
          </p>
        )}
        <Link href="/contacto" className="inline-block mt-4">
          <Button className="gap-2">Ir a contacto</Button>
        </Link>
      </div>
    </div>
  );
}
