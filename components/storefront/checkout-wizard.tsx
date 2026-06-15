"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "./order-summary";
import { useCart } from "./cart-context";
import { MercadoPagoFields, submitMpForm, type MpPaymentData } from "./mercadopago-fields";
import { placeOrderAction } from "@/lib/actions/order";

type Step = 1 | 2 | 3;

interface Contact { email: string; phone: string }
interface Shipping {
  firstName: string; lastName: string;
  address: string; city: string; region: string; zip: string;
}

const SEED_CONTACT: Contact = { email: "maria@correo.com", phone: "+57 300 123 4567" };
const SEED_SHIPPING: Shipping = {
  firstName: "María", lastName: "Restrepo",
  address: "Cra 12 #34-56", city: "Bogotá", region: "Cundinamarca", zip: "",
};

export function CheckoutWizard({
  paymentProvider,
  mpPublicKey,
}: {
  paymentProvider?: string | null;
  mpPublicKey?: string | null;
}) {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [contact, setContact] = useState(SEED_CONTACT);
  const [shipping, setShipping] = useState(SEED_SHIPPING);
  const [payError, setPayError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const goNext = (s: Step) => setStep(Math.min(3, s + 1) as Step);

  // Called by MercadoPagoFields after tokenization
  const handleMpToken = async (mpData: MpPaymentData) => {
    await submitOrder(mpData);
  };

  // Called when there is no MP integration (demo / future gateway)
  const handlePlainPay = async () => {
    await submitOrder(undefined);
  };

  const submitOrder = async (payment?: MpPaymentData) => {
    setPlacing(true);
    setPayError(null);
    const result = await placeOrderAction({
      contact,
      shipping,
      items: cart.items,
      payment,
    });
    setPlacing(false);
    if ("error" in result) {
      setPayError(result.error);
      return;
    }
    cart.clear();
    router.push("/checkout/confirmacion");
  };

  const isMp = paymentProvider === "mercadopago" && !!mpPublicKey;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1fr_400px] gap-12">
      <div className="space-y-4">
        <Link href="/" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Volver
        </Link>

        {/* ── Step 1: Contacto ── */}
        <StepBlock
          n={1}
          title="Contacto"
          state={step === 1 ? "open" : step > 1 ? "done" : "todo"}
          onEdit={() => setStep(1)}
          collapsedSummary={`${contact.email} · ${contact.phone}`}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} type="email" autoComplete="email" />
            <Field label="Teléfono" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} autoComplete="tel" />
          </div>
          <Button className="mt-6" onClick={() => goNext(1)}>
            Continuar a envío →
          </Button>
        </StepBlock>

        {/* ── Step 2: Dirección ── */}
        <StepBlock
          n={2}
          title="Dirección de envío"
          state={step === 2 ? "open" : step > 2 ? "done" : "todo"}
          onEdit={() => setStep(2)}
          collapsedSummary={`${shipping.address}, ${shipping.city}`}
        >
          <div className="rounded-md border border-border p-4 flex items-center gap-3 mb-4">
            <span className="size-4 rounded-full border border-foreground bg-foreground text-background grid place-items-center">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium">Casa</div>
              <div className="text-xs text-muted-foreground">{shipping.address}, {shipping.city}</div>
            </div>
            <button className="text-xs underline-offset-2 hover:underline">Editar</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nombre" value={shipping.firstName} onChange={(v) => setShipping({ ...shipping, firstName: v })} autoComplete="given-name" />
            <Field label="Apellido" value={shipping.lastName} onChange={(v) => setShipping({ ...shipping, lastName: v })} autoComplete="family-name" />
            <Field className="sm:col-span-2" label="Dirección" value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} autoComplete="street-address" />
            <Field label="Ciudad" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} autoComplete="address-level2" />
            <Field label="Departamento" value={shipping.region} onChange={(v) => setShipping({ ...shipping, region: v })} autoComplete="address-level1" />
            <Field label="Código postal" value={shipping.zip} onChange={(v) => setShipping({ ...shipping, zip: v })} placeholder="110111" autoComplete="postal-code" />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="size-4 accent-foreground" />
            <span>Guardar esta dirección en mi cuenta</span>
          </label>
          <Button className="mt-6" onClick={() => goNext(2)}>
            Continuar a pago →
          </Button>
        </StepBlock>

        {/* ── Step 3: Pago ── */}
        <StepBlock
          n={3}
          title="Método de pago"
          state={step === 3 ? "open" : "todo"}
          onEdit={() => setStep(3)}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Tus datos viajan cifrados. No guardamos números de tarjeta.
          </p>

          {payError && (
            <div className="mb-4 rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
              {payError}
            </div>
          )}

          {isMp ? (
            <MercadoPagoFields
              mpPublicKey={mpPublicKey!}
              amountCents={cart.subtotalCents}
              onToken={handleMpToken}
              onError={setPayError}
            />
          ) : (
            // Fallback plain fields — replaced by real gateway once connected
            <div className="grid gap-3">
              <Field
                label="Número de tarjeta"
                value=""
                onChange={() => {}}
                placeholder="4242 4242 4242 4242"
                autoComplete="cc-number"
                inputMode="numeric"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vencimiento" value="" onChange={() => {}} placeholder="MM / YY" autoComplete="cc-exp" inputMode="numeric" />
                <Field label="CVC" value="" onChange={() => {}} placeholder="123" autoComplete="cc-csc" inputMode="numeric" />
              </div>
              <Field label="Nombre en la tarjeta" value="" onChange={() => {}} autoComplete="cc-name" />
            </div>
          )}

          <Button
            size="lg"
            className="mt-6 w-full h-12 text-base justify-center"
            disabled={placing}
            onClick={isMp ? submitMpForm : handlePlainPay}
          >
            {placing && <Loader2 className="size-4 animate-spin mr-2" />}
            {placing ? "Procesando…" : "Confirmar y pagar"}
          </Button>
        </StepBlock>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit">
        <OrderSummary />
      </aside>
    </div>
  );
}

function StepBlock({
  n, title, state, onEdit, collapsedSummary, children,
}: {
  n: number;
  title: string;
  state: "todo" | "open" | "done";
  onEdit?: () => void;
  collapsedSummary?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-background overflow-hidden">
      <header className={"flex items-center gap-3 px-5 py-4 " + (state === "open" ? "border-b border-border" : "")}>
        <span className={"size-7 rounded-full grid place-items-center text-xs font-semibold " + (state === "open" ? "bg-foreground text-background" : state === "done" ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground")}>
          {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : n}
        </span>
        <span className="font-display text-lg font-semibold flex-1">{title}</span>
        {state === "done" && onEdit && (
          <button onClick={onEdit} className="text-xs underline-offset-2 hover:underline">Editar</button>
        )}
        {state === "todo" && <ChevronDown className="size-4 text-muted-foreground" />}
      </header>
      {state === "open" && <div className="px-5 py-5">{children}</div>}
      {state === "done" && collapsedSummary && (
        <div className="px-5 pb-4 text-xs text-muted-foreground">{collapsedSummary}</div>
      )}
    </section>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, className, autoComplete, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}
