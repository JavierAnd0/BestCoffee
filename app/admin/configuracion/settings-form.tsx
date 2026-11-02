"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Truck,
  Share2,
  FileText,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MercadoPagoConnectButton } from "@/components/admin/mercadopago-connect-button";
import {
  saveAdminSettingsAction,
  type AdminMutationResult,
} from "@/lib/actions/admin-mutations";

export function AdminSettingsForm({ mpConnected }: { mpConnected: boolean }) {
  const [state, dispatch, isPending] = useActionState<
    AdminMutationResult | null,
    FormData
  >(saveAdminSettingsAction, null);

  return (
    <form action={dispatch} className="space-y-6">
      {state && (
        <div
          className={
            "rounded-md border px-4 py-3 text-sm flex items-center gap-2 " +
            (state.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-red-300/60 bg-red-50 text-red-800")
          }
        >
          {state.ok && <Check className="size-4 shrink-0" />}
          <span>{state.ok ? state.message : state.error}</span>
        </div>
      )}

      <SettingsCard
        icon={<CreditCard className="size-4" />}
        title="Pasarela de pago"
        body="Conecta MercadoPago para recibir pagos con tarjeta directamente en el checkout."
      >
        <MercadoPagoConnectButton connected={mpConnected} />
      </SettingsCard>

      <SettingsCard
        icon={<Truck className="size-4" />}
        title="Envío y suscripciones"
        body="Parámetros que afectan el cálculo de precios y la disponibilidad."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            name="freeShippingThresholdCop"
            label="Umbral envío gratis (COP)"
            value="45000"
            hint="Pedidos iguales o mayores no pagan envío."
          />
          <Field
            name="subscriptionDiscountPct"
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
          <Field name="legalName" label="Razón social" value="ORÍGEN Café S.A.S." />
          <Field name="taxId" label="NIT" value="900.123.456-7" />
          <Field
            name="fiscalAddress"
            label="Dirección fiscal"
            value="Cra 13 #57-32, Bogotá"
          />
          <Field
            name="contactEmail"
            label="Correo de contacto"
            value="hola@cafeorigen.co"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Mail className="size-4" />}
        title="Plantillas de correo"
        body="Asunto y cuerpo de los correos transaccionales enviados mediante Resend."
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
              <span className="text-xs text-emerald-700 font-medium">Activa (Resend)</span>
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
          <Field
            name="instagramUrl"
            label="Instagram"
            value="https://instagram.com/cafeorigen"
          />
          <Field
            name="tiktokUrl"
            label="TikTok"
            value="https://tiktok.com/@cafeorigen"
          />
          <Field name="xUrl" label="X" value="https://x.com/cafeorigen" />
          <Field
            name="youtubeUrl"
            label="YouTube"
            value=""
            placeholder="https://youtube.com/@..."
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<FileText className="size-4" />}
        title="Páginas legales"
        body="Términos, privacidad y devoluciones publicados en el storefront."
      >
        <ul className="space-y-2">
          {[
            { label: "Términos y condiciones", href: "/legal/terminos" },
            { label: "Política de privacidad", href: "/legal/privacidad" },
            { label: "Política de devoluciones", href: "/devoluciones" },
          ].map((p) => (
            <li
              key={p.label}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm">{p.label}</span>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={p.href}>Ver página</Link>}
              />
            </li>
          ))}
        </ul>
      </SettingsCard>

      <div className="sticky bottom-0 bg-muted/30 -mx-8 px-8 py-4 border-t border-border flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
          {isPending ? "Guardando…" : "Guardar todos los cambios"}
        </Button>
      </div>
    </form>
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
  name,
  label,
  value,
  hint,
  placeholder,
}: {
  name: string;
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
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

