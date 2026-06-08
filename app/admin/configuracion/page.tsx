import type { Metadata } from "next";
import { Building2, Mail, Truck, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Configuración · Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Ajustes globales de la tienda." />

      <SettingsCard
        icon={<Truck className="size-4" />}
        title="Envío y suscripciones"
        body="Parámetros que afectan el cálculo de precios y la disponibilidad."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Umbral envío gratis (COP)"
            value="45000"
            hint="Pedidos iguales o mayores no pagan envío."
          />
          <Field
            label="Descuento de suscripción global (%)"
            value="15"
            hint="Aplica a todos los productos suscribibles, salvo override por producto."
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Building2 className="size-4" />}
        title="Datos de la empresa"
        body="Información fiscal y de contacto que aparece en correos y facturas."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Razón social" value="ORÍGEN Café S.A.S." />
          <Field label="NIT" value="900.123.456-7" />
          <Field label="Dirección fiscal" value="Cra 13 #57-32, Bogotá" />
          <Field label="Correo de contacto" value="hola@cafeorigen.co" />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Mail className="size-4" />}
        title="Plantillas de correo"
        body="Asunto y cuerpo de los correos transaccionales. Variables disponibles entre llaves."
      >
        <ul className="space-y-2">
          {[
            "Confirmación de pedido",
            "Envío realizado",
            "Bienvenida al club",
            "Recordatorio próximo envío",
            "Pago fallido en suscripción",
          ].map((t) => (
            <li
              key={t}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm">{t}</span>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        icon={<Share2 className="size-4" />}
        title="Redes sociales"
        body="Enlaces que aparecen en el footer y en correos."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Instagram" value="https://instagram.com/cafeorigen" />
          <Field label="TikTok" value="https://tiktok.com/@cafeorigen" />
          <Field label="X" value="https://x.com/cafeorigen" />
          <Field label="YouTube" value="" placeholder="https://youtube.com/@..." />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<FileText className="size-4" />}
        title="Páginas legales"
        body="Términos, privacidad, devoluciones. Enlaces que aparecen en el footer."
      >
        <ul className="space-y-2">
          {["Términos y condiciones", "Política de privacidad", "Política de devoluciones", "Aviso de cookies"].map((p) => (
            <li
              key={p}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm">{p}</span>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <div className="sticky bottom-0 bg-muted/30 -mx-8 px-8 py-4 border-t border-border flex justify-end">
        <Button>Guardar todos los cambios</Button>
      </div>
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-6">
      <header className="flex items-center gap-3 mb-5">
        <span className="size-9 rounded-md bg-muted grid place-items-center">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{body}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
