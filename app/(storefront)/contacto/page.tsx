import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Mail, Clock, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contacto y Atención al Cliente",
  description:
    "Comunícate con el equipo de ORÍGEN. Estamos disponibles para resolver cualquier duda sobre tus pedidos de café especial, suscripciones o despachos.",
};

const CHANNELS = [
  {
    icon: <Mail className="size-5 text-primary" />,
    title: "Correo electrónico",
    detail: "hola@bestcoffee.io",
    description: "Respuesta promedio en menos de 24 horas hábiles.",
    action: "mailto:hola@bestcoffee.io",
    actionText: "Escribir correo",
  },
  {
    icon: <MessageCircle className="size-5 text-primary" />,
    title: "WhatsApp y Chat",
    detail: "+57 300 123 4567",
    description: "Atención rápida para novedades con envíos del día.",
    action: "https://wa.me/573001234567",
    actionText: "Abrir WhatsApp",
  },
  {
    icon: <Clock className="size-5 text-primary" />,
    title: "Horario de atención",
    detail: "Lunes a Viernes: 8:00 AM – 6:00 PM",
    description: "Sábados: 9:00 AM – 1:00 PM (Hora Colombia).",
  },
  {
    icon: <MapPin className="size-5 text-primary" />,
    title: "Tostaduría & Bar de Café",
    detail: "Calle 69 # 4-48, Chapinero",
    description: "Bogotá D.C., Colombia.",
  },
];

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Encabezado */}
      <header className="mb-14 text-center max-w-2xl mx-auto">
        <Eyebrow>Centro de Ayuda</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Hablemos de café
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          ¿Tienes preguntas sobre un café, tu ciclo de suscripción o necesitas asesoría para elegir tu molienda? Estamos listos para ayudarte.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        {/* Canales de contacto */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Canales de atención
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {CHANNELS.map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 grid place-items-center">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{c.title}</h3>
                    <p className="font-semibold text-sm text-primary">{c.detail}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">{c.description}</p>
                {c.action && (
                  <div className="pt-1">
                    <a
                      href={c.action}
                      target={c.action.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {c.actionText} →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-6">
            Envíanos un mensaje
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
