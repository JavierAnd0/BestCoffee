"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, Truck, Store, FileText, CreditCard, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MercadoPagoConnectButton } from "@/components/admin/mercadopago-connect-button";
import { EpaycoKeysForm } from "@/components/admin/epayco-keys-form";
import {
  saveAdminSettingsAction,
  type AdminMutationResult,
} from "@/lib/actions/admin-mutations";
import type { AdminStoreSettings, EpaycoStatus } from "@/lib/data/admin";
import { formatCop } from "@/lib/format";

export function AdminSettingsForm({
  mpConnected,
  mpResult = null,
  epayco = null,
  settings,
  effectiveFreeShippingCents,
  effectiveShippingFlatCents,
}: {
  mpConnected: boolean;
  mpResult?: "connected" | "error" | null;
  epayco?: EpaycoStatus | null;
  /** `null` = la API no devolvió la configuración (sin permiso o caída). */
  settings: AdminStoreSettings | null;
  effectiveFreeShippingCents: number;
  effectiveShippingFlatCents: number;
}) {
  const [state, dispatch, isPending] = useActionState<
    AdminMutationResult | null,
    FormData
  >(saveAdminSettingsAction, null);

  const pesos = (cents: number | null) => (cents == null ? "" : String(Math.round(cents / 100)));

  return (
    <div className="space-y-6">
      <SettingsCard
        icon={<CreditCard className="size-4" />}
        title="Pasarela de pago"
        body="Conecta MercadoPago y tus clientes pagan en MercadoPago con tarjeta, PSE, Nequi, Efecty o su saldo. El dinero llega a tu cuenta de MercadoPago."
      >
        <MercadoPagoConnectButton connected={mpConnected} result={mpResult} />
      </SettingsCard>

      <SettingsCard
        icon={<CreditCard className="size-4" />}
        title="ePayco"
        body="Cobra con ePayco (DaviPay): tarjetas, PSE, Daviplata y efectivo. El dinero llega a tu cuenta de ePayco. La última pasarela que conectes es la que usa el checkout."
      >
        <EpaycoKeysForm status={epayco} />
      </SettingsCard>

      {!settings ? (
        <div
          role="alert"
          className="rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          No se pudo cargar la configuración de la tienda. Solo el dueño de la tienda puede
          verla y cambiarla; si lo eres, recarga la página en unos segundos.
        </div>
      ) : (
        <form action={dispatch} className="space-y-6">
          {state && (
            <div
              role={state.ok ? "status" : "alert"}
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
            icon={<Store className="size-4" />}
            title="Tienda"
            body="Nombre con el que tu tienda aparece en el sitio, los correos y el panel."
          >
            <Field name="name" label="Nombre de la tienda" value={settings.name} required />
          </SettingsCard>

          <SettingsCard
            icon={<Truck className="size-4" />}
            title="Envío"
            body="Montos que usa el carrito para calcular el envío de cada pedido."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                name="freeShippingThreshold"
                label="Envío gratis desde (COP)"
                type="number"
                value={pesos(settings.freeShippingThresholdCents)}
                placeholder={pesos(effectiveFreeShippingCents)}
                hint={
                  settings.freeShippingThresholdCents == null
                    ? `Sin definir: hoy se usa ${formatCop(effectiveFreeShippingCents)}.`
                    : "Pedidos iguales o mayores no pagan envío."
                }
              />
              <Field
                name="shippingFlat"
                label="Tarifa de envío (COP)"
                type="number"
                value={pesos(settings.shippingFlatCents)}
                placeholder={pesos(effectiveShippingFlatCents)}
                hint={
                  settings.shippingFlatCents == null
                    ? `Sin definir: hoy se usa ${formatCop(effectiveShippingFlatCents)}.`
                    : "Se cobra cuando el pedido no alcanza el envío gratis."
                }
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<Building2 className="size-4" />}
            title="Datos de la empresa"
            body="Aparecen en las facturas, los textos legales y el contacto de la tienda. Deja vacío lo que no aplique."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="legalName" label="Razón social" value={settings.legalName} />
              <Field name="legalId" label="NIT" value={settings.legalId} />
              <Field
                name="contactEmail"
                label="Correo de contacto"
                type="email"
                value={settings.contactEmail}
              />
              <Field name="contactPhone" label="Teléfono de contacto" value={settings.contactPhone} />
              <Field name="city" label="Ciudad" value={settings.city} />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={<FileText className="size-4" />}
            title="Páginas legales"
            body="Términos, privacidad y devoluciones publicados en tu tienda con los datos de arriba."
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

          <div className="sticky bottom-0 bg-muted/30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      )}
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
  name,
  label,
  value,
  hint,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "number";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block admin-label mb-1.5">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

