import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Truck, Mail } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { getCurrentTenant } from "@/lib/data/tenant";

// Página compartida por todas las tiendas: solo dice lo que el sistema hace de
// verdad (el costo se calcula al pagar) y remite al contacto de la tienda. Sin
// zonas, transportadoras ni tarifas escritas a mano.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: "Envíos",
    description: `Cómo funcionan los envíos de ${tenant.brand}.`,
  };
}

export default async function EnviosPage() {
  const tenant = await getCurrentTenant();
  const email = tenant.branding.contactEmail;
  const phone = tenant.branding.contactPhone;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12 text-center">
        <Eyebrow>Envíos</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Envíos de {tenant.brand}
        </h1>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-background p-6 space-y-2">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <Truck className="size-5 text-primary" />
            Costo del envío
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El costo del envío se calcula según tu dirección y se muestra antes de confirmar
            el pedido.
          </p>
        </section>

        {(email || phone) && (
          <section className="rounded-xl border border-border bg-background p-6 space-y-2">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
              <Mail className="size-5 text-primary" />
              ¿Dudas sobre tu envío?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Escríbenos
              {email && (
                <>
                  {" "}a{" "}
                  <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-foreground">
                    {email}
                  </a>
                </>
              )}
              {phone && (
                <>
                  {email ? " o llámanos al " : " al "}
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {phone}
                  </a>
                </>
              )}
              .
            </p>
          </section>
        )}
      </div>

      {tenant.features.catalog && (
        <div className="text-center pt-12">
          <Button render={<Link href="/catalogo" />} className="gap-2">
            Ver catálogo <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
