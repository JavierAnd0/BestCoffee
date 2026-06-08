"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "./order-summary";
import { useCart } from "./cart-context";

type Step = 1 | 2 | 3;

interface Contact {
  email: string;
  phone: string;
}

interface Shipping {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  region: string;
  zip: string;
}

interface Payment {
  card: string;
  exp: string;
  cvc: string;
  name: string;
}

const SEED_CONTACT: Contact = { email: "maria@correo.com", phone: "+57 300 123 4567" };
const SEED_SHIPPING: Shipping = {
  firstName: "María",
  lastName: "Restrepo",
  address: "Cra 12 #34-56",
  city: "Bogotá",
  region: "Cundinamarca",
  zip: "",
};
const SEED_PAYMENT: Payment = { card: "", exp: "", cvc: "", name: "" };

export function CheckoutWizard() {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [contact, setContact] = useState(SEED_CONTACT);
  const [shipping, setShipping] = useState(SEED_SHIPPING);
  const [payment, setPayment] = useState(SEED_PAYMENT);

  const goNext = (s: Step) => setStep(Math.min(3, (s + 1) as Step) as Step);
  const placeOrder = () => {
    cart.clear();
    router.push("/checkout/confirmacion");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1fr_400px] gap-12">
      <div className="space-y-4">
        <Link href="/" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Volver
        </Link>

        <StepBlock
          n={1}
          title="Contacto"
          state={step === 1 ? "open" : step > 1 ? "done" : "todo"}
          onEdit={() => setStep(1)}
          collapsedSummary={`${contact.email} · ${contact.phone}`}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} type="email" />
            <Field label="Teléfono" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          </div>
          <Button className="mt-6" onClick={() => goNext(1)}>
            Continuar a envío →
          </Button>
        </StepBlock>

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
              <div className="text-xs text-muted-foreground">
                {shipping.address}, {shipping.city}
              </div>
            </div>
            <button className="text-xs underline-offset-2 hover:underline">Editar</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nombre" value={shipping.firstName} onChange={(v) => setShipping({ ...shipping, firstName: v })} />
            <Field label="Apellido" value={shipping.lastName} onChange={(v) => setShipping({ ...shipping, lastName: v })} />
            <Field className="sm:col-span-2" label="Dirección" value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} />
            <Field label="Ciudad" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} />
            <Field label="Departamento" value={shipping.region} onChange={(v) => setShipping({ ...shipping, region: v })} />
            <Field label="Código postal" value={shipping.zip} onChange={(v) => setShipping({ ...shipping, zip: v })} placeholder="110111" />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="size-4 accent-foreground" />
            <span>Guardar esta dirección en mi cuenta</span>
          </label>

          <Button className="mt-6" onClick={() => goNext(2)}>
            Continuar a pago →
          </Button>
        </StepBlock>

        <StepBlock
          n={3}
          title="Método de pago"
          state={step === 3 ? "open" : "todo"}
          onEdit={() => setStep(3)}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Tus datos viajan cifrados. No guardamos números de tarjeta.
          </p>
          <div className="grid gap-3">
            <Field label="Número de tarjeta" value={payment.card} onChange={(v) => setPayment({ ...payment, card: v })} placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vencimiento" value={payment.exp} onChange={(v) => setPayment({ ...payment, exp: v })} placeholder="MM / YY" />
              <Field label="CVC" value={payment.cvc} onChange={(v) => setPayment({ ...payment, cvc: v })} placeholder="123" />
            </div>
            <Field label="Nombre en la tarjeta" value={payment.name} onChange={(v) => setPayment({ ...payment, name: v })} />
          </div>
          <Button size="lg" className="mt-6 w-full h-12 text-base justify-center" onClick={placeOrder}>
            Confirmar y pagar
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
  n,
  title,
  state,
  onEdit,
  collapsedSummary,
  children,
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
      <header
        className={
          "flex items-center gap-3 px-5 py-4 " +
          (state === "open" ? "border-b border-border" : "")
        }
      >
        <span
          className={
            "size-7 rounded-full grid place-items-center text-xs font-semibold " +
            (state === "open"
              ? "bg-foreground text-background"
              : state === "done"
                ? "bg-foreground/10 text-foreground"
                : "bg-muted text-muted-foreground")
          }
        >
          {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : n}
        </span>
        <span className="font-display text-lg font-semibold flex-1">{title}</span>
        {state === "done" && onEdit && (
          <button onClick={onEdit} className="text-xs underline-offset-2 hover:underline">
            Editar
          </button>
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
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
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
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}
