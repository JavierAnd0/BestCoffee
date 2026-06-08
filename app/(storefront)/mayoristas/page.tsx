import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mayoristas · B2B" };

const PERKS = [
  {
    title: "Precios por volumen",
    body: "Tarifa diferenciada con escalas según el volumen mensual contratado.",
  },
  {
    title: "Capacitación incluida",
    body: "Entrenamiento básico de barismo para tu equipo y soporte en montaje.",
  },
  {
    title: "Recetas y perfiles",
    body: "Trabajamos contigo el perfil de tueste y la receta para tu equipo.",
  },
  {
    title: "Envíos programados",
    body: "Logística semanal o quincenal según tu rotación y bodega.",
  },
];

export default function MayoristasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <Eyebrow>Mayoristas · B2B</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Café para tu negocio
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Trabajamos con cafeterías, restaurantes, hoteles y oficinas. Cuéntanos
          de tu operación y te respondemos en menos de 48 horas.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 gap-6 mb-16">
        {PERKS.map((p) => (
          <div key={p.title} className="rounded-lg border border-border bg-background p-6">
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {p.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
          </div>
        ))}
      </section>

      <form className="rounded-lg border border-border bg-background p-8 space-y-4 max-w-xl mx-auto">
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">
          Cuéntanos de tu negocio
        </h2>
        <Field label="Nombre del negocio" placeholder="Café Lecho" />
        <Field label="Tu nombre" placeholder="Tu nombre y apellido" />
        <Field label="Email" type="email" placeholder="contacto@negocio.com" />
        <Field label="Teléfono" placeholder="+57 300 000 0000" />
        <Field
          label="Volumen mensual estimado (kg)"
          placeholder="Ej. 20 kg"
        />
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Cuéntanos más
          </span>
          <textarea
            rows={4}
            placeholder="Tipo de negocio, equipo, ubicación, expectativa de inicio..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40 resize-y"
          />
        </label>
        <Button size="lg" className="w-full h-12 text-base justify-center">
          Enviar solicitud
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}
