import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Truck, Clock, ShieldCheck, Gift, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Políticas y Tiempos de Envío",
  description:
    "Conoce nuestros tiempos de entrega, cobertura nacional y política de envíos para café recién tostado.",
};

const FEATURES = [
  {
    icon: <Clock className="size-5 text-primary" />,
    title: "Tostado fresco bajo pedido",
    body: "Tostamos semanalmente en pequeños lotes. Tu café se empaca con válvula desgasificadora y fecha de tueste visible.",
  },
  {
    icon: <Truck className="size-5 text-primary" />,
    title: "Cobertura en toda Colombia",
    body: "Llegamos a ciudades principales y municipios a través de aliados logísticos de primera línea como Coordinadora y Envía.",
  },
  {
    icon: <Gift className="size-5 text-primary" />,
    title: "Envío gratis garantizado",
    body: "Disfruta de envío gratis en compras superiores a $120.000 COP o en cualquier modalidad de suscripción recurrente activa.",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    title: "Seguimiento en tiempo real",
    body: "Recibirás la guía de rastreo inmediatamente sea generado el despacho para seguir cada etapa del trayecto.",
  },
];

const DESTINATIONS = [
  {
    zone: "Bogotá D.C. y Sabana",
    time: "1 a 2 días hábiles",
    cost: "$9.000 COP (Gratis > $120.000 COP)",
    notes: "Despacho prioritario desde nuestra tostaduría.",
  },
  {
    zone: "Medellín y Área Metropolitana",
    time: "1 a 2 días hábiles",
    cost: "$9.000 COP (Gratis > $120.000 COP)",
    notes: "Ruta directa diaria.",
  },
  {
    zone: "Otras ciudades principales (Cali, Barranquilla, Bucaramanga, Eje Cafetero)",
    time: "2 a 3 días hábiles",
    cost: "$12.500 COP (Gratis > $120.000 COP)",
    notes: "Vía terrestre expresa.",
  },
  {
    zone: "Municipios intermedios y trayectos especiales",
    time: "3 a 5 días hábiles",
    cost: "$16.000 COP (Gratis > $150.000 COP)",
    notes: "Depende de la frecuencia de entrega local de la transportadora.",
  },
];

export default function EnviosPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-14 text-center max-w-2xl mx-auto">
        <Eyebrow>Logística & Entregas</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Envíos y Cobertura
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Nos aseguramos de que el café llegue a tu taza con el pico ideal de sabor, justo después de su reposo post-tueste.
        </p>
      </header>

      {/* Características principales */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-6 text-card-foreground space-y-3"
          >
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
              {f.icon}
            </div>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      {/* Tiempos de entrega por zona */}
      <section className="mb-16">
        <div className="max-w-2xl mb-8">
          <Eyebrow>Tiempos estimados</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Tiempos de entrega y tarifas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Los tiempos empiezan a contar a partir de la confirmación del pago y la fecha de tueste asignada.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {DESTINATIONS.map((d) => (
            <div
              key={d.zone}
              className="rounded-xl border border-border bg-card p-6 text-card-foreground flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <MapPin className="size-4" />
                  <span>{d.zone}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold">
                    {d.time}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground/90">
                  Tarifa regular: {d.cost}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {d.notes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes de despacho */}
      <section className="rounded-2xl border border-border bg-muted/30 p-8 sm:p-12 mb-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight mb-6">
          Preguntas frecuentes sobre tu despacho
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed">
          <div>
            <h4 className="font-semibold text-foreground text-base">
              ¿Cómo puedo rastrear mi pedido?
            </h4>
            <p className="text-muted-foreground mt-2">
              Una vez despachado el paquete, te enviaremos un correo con el número de guía y el transportador asignado. También puedes consultarlo en cualquier momento en tu sección{" "}
              <Link href="/cuenta/pedidos" className="text-primary hover:underline">
                Mis Pedidos
              </Link>.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-base">
              ¿Qué ocurre si no estoy en la dirección de entrega?
            </h4>
            <p className="text-muted-foreground mt-2">
              La empresa transportadora realiza hasta dos intentos de entrega adicionales. Puedes coordinar la entrega o autorizar en portería indicándolo al registrar tu dirección.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-base">
              ¿Hacen envíos internacionales?
            </h4>
            <p className="text-muted-foreground mt-2">
              Actualmente operamos despachos directos dentro de todo el territorio colombiano. Para órdenes institucionales al exterior, contáctanos a través de{" "}
              <Link href="/mayoristas" className="text-primary hover:underline">
                Mayoristas · B2B
              </Link>.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-base">
              ¿Puedo cambiar la dirección de entrega de mi pedido en curso?
            </h4>
            <p className="text-muted-foreground mt-2">
              Si tu orden no ha sido entregada a la transportadora, podemos actualizarla de inmediato. Escríbenos rápidamente a nuestro canal de soporte de{" "}
              <Link href="/contacto" className="text-primary hover:underline">
                Contacto
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA inferior */}
      <div className="text-center py-6">
        <h3 className="font-display text-2xl font-semibold">¿Listo para probar nuestro café?</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Explora nuestra selección de cosechas de temporada de Huila, Nariño y Tolima.
        </p>
        <Link href="/catalogo">
          <Button className="gap-2">
            Ver catálogo completo <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

