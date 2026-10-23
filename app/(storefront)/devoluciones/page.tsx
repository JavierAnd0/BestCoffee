import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RotateCcw, ShieldCheck, Coffee, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Garantía y Devoluciones",
  description:
    "Nuestra política de garantía de frescura, reemplazo por novedades de transporte y devoluciones en equipos.",
};

const POLICIES = [
  {
    icon: <Coffee className="size-5 text-primary" />,
    title: "Garantía de frescura en café",
    description:
      "El café en grano es un alimento perecedero. Por normativa sanitaria no podemos aceptar devoluciones físicas de bolsas abiertas; sin embargo, si tu café presenta cualquier defecto de tueste o no coincide con tu orden, te enviamos una nueva bolsa sin costo adicional.",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    title: "Novedades durante el transporte",
    description:
      "Si tu paquete llega con daños visibles en el empaque o empaque roto, notifícanos en las primeras 48 horas tras recibirlo. Gestionaremos inmediatamente un nuevo envío prioritario.",
  },
  {
    icon: <RotateCcw className="size-5 text-primary" />,
    title: "Accesorios, molinos y cafeteras",
    description:
      "Para equipos y accesorios cuentas con 30 días calendario para solicitar retracto (el producto debe estar nuevo, sin uso y en empaque original) y hasta 1 año de garantía legal por defectos de fabricación.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Toma fotos del producto y paquete",
    body: "Toma una foto de la guía de envío, el empaque exterior y el detalle del producto o fecha de tueste.",
  },
  {
    step: "02",
    title: "Contáctanos con tu número de orden",
    body: "Escríbenos a hola@bestcoffee.io o por WhatsApp indicando tu número de pedido y la descripción de la novedad.",
  },
  {
    step: "03",
    title: "Solución en menos de 24 horas",
    body: "Coordinamos el reemplazo exprés del producto o el reembolso del dinero según tu preferencia.",
  },
];

export default function DevolucionesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-14 text-center max-w-2xl mx-auto">
        <Eyebrow>Compromiso con el cliente</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Garantía y Devoluciones
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Queremos que cada taza sea una experiencia excepcional. Si algo no está perfecto con tu pedido, lo corregimos.
        </p>
      </header>

      {/* Políticas */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        {POLICIES.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border bg-card p-6 text-card-foreground space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center mb-4">
                {p.icon}
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Pasos para solicitar garantía */}
      <section className="mb-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <Eyebrow>Paso a paso</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            ¿Cómo reportar una novedad?
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            El proceso es simple, sin trámites engorrosos ni tiempos de espera excesivos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="rounded-xl border border-border bg-card p-6 text-card-foreground relative"
            >
              <span className="font-display text-3xl font-bold text-primary/40 block mb-2">
                {s.step}
              </span>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Aclaración de reembolsos */}
      <section className="rounded-2xl border border-border bg-muted/30 p-8 max-w-3xl mx-auto mb-12 text-sm leading-relaxed space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold text-base">
          <AlertCircle className="size-5 text-primary" />
          <span>Tiempos de procesamiento de reembolsos</span>
        </div>
        <p className="text-muted-foreground">
          En los casos en que aplique un reembolso económico:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
          <li>
            <strong>Pagos con tarjeta de crédito/débito:</strong> El reembolso se envía a la pasarela de pagos en 1 a 2 días hábiles; el reflejo en tu extracto bancario depende de la entidad emisora (habitualmente entre 5 y 15 días hábiles).
          </li>
          <li>
            <strong>Pagos PSE o transferencias directas:</strong> Se abonan a la cuenta bancaria informada en un plazo máximo de 3 a 5 días hábiles.
          </li>
        </ul>
      </section>

      {/* Banner de Contacto */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <Sparkles className="size-3.5" />
          Atención personalizada
        </div>
        <h3 className="font-display text-2xl font-semibold">¿Tienes un caso pendiente?</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Nuestro canal de soporte está listo para asistirte de inmediato.
        </p>
        <Link href="/contacto">
          <Button className="gap-2">Ir a canal de soporte</Button>
        </Link>
      </div>
    </div>
  );
}

