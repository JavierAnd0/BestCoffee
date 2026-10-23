"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Loader2,
  CreditCard,
  Building2,
  Banknote,
  MapPin,
  ShoppingBag,
  ArrowRight,
  User,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderSummary } from "./order-summary";
import { useCart } from "./cart-context";
import { MercadoPagoFields, submitMpForm, type MpPaymentData } from "./mercadopago-fields";
import { ColombiaLocationSelector } from "./colombia-location-selector";
import { placeOrderAction } from "@/lib/actions/order";
import type { MockAddress, MockCustomer } from "@/lib/mocks/account";

type Step = 1 | 2 | 3;
type PaymentMethodType = "card" | "pse" | "cash_on_delivery";

interface Contact {
  email: string;
  phone: string;
}

interface Shipping {
  firstName: string;
  lastName: string;
  address: string;
  line2: string;
  city: string;
  region: string;
  zip: string;
}

const SEED_CONTACT: Contact = { email: "maria@correo.com", phone: "+57 300 123 4567" };
const SEED_SHIPPING: Shipping = {
  firstName: "María",
  lastName: "Restrepo",
  address: "Cra 12 # 34-56",
  line2: "Apto 402",
  city: "Bogotá",
  region: "Cundinamarca",
  zip: "110111",
};

const EMPTY_CONTACT: Contact = { email: "", phone: "" };
const EMPTY_SHIPPING: Shipping = {
  firstName: "",
  lastName: "",
  address: "",
  line2: "",
  city: "",
  region: "",
  zip: "",
};

const COLOMBIAN_BANKS = [
  "Bancolombia",
  "Nequi",
  "Daviplata",
  "Banco Davivienda",
  "Banco de Bogotá",
  "Scotiabank Colpatria",
  "BBVA Colombia",
  "Banco de Occidente",
  "Nu Colombia",
  "Lulo Bank",
];

export function CheckoutWizard({
  paymentProvider,
  mpPublicKey,
  useMocks = false,
  customer,
  savedAddresses = [],
}: {
  paymentProvider?: string | null;
  mpPublicKey?: string | null;
  useMocks?: boolean;
  customer?: MockCustomer | null;
  savedAddresses?: MockAddress[];
}) {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);

  // Inicialización de contacto
  const [contact, setContact] = useState<Contact>(() => {
    if (customer?.email) {
      return {
        email: customer.email,
        phone: customer.phone || (useMocks ? SEED_CONTACT.phone : ""),
      };
    }
    return useMocks ? SEED_CONTACT : EMPTY_CONTACT;
  });

  // Inicialización de dirección de entrega
  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState<string | "custom">(
    defaultAddress ? defaultAddress.id : "custom"
  );

  const [shipping, setShipping] = useState<Shipping>(() => {
    if (defaultAddress) {
      const parts = (customer?.name || "Cliente").split(" ");
      return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        address: defaultAddress.line1 || defaultAddress.line,
        line2: defaultAddress.line2 || "",
        city: defaultAddress.city || "Bogotá",
        region: defaultAddress.state || "Cundinamarca",
        zip: defaultAddress.postalCode || "",
      };
    }
    if (useMocks) return SEED_SHIPPING;
    const parts = (customer?.name || "").split(" ");
    return {
      ...EMPTY_SHIPPING,
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  });

  // Estados de validación de pasos
  const [contactError, setContactError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Método de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
  const [pseData, setPseData] = useState({
    bank: "Bancolombia",
    idType: "CC",
    idNumber: "",
  });

  // Cupón de descuento aplicado
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
    discountCents: number;
  } | null>(null);

  const [payError, setPayError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // Validación y paso siguiente de Contacto
  function handleContinueFromContact() {
    setContactError(null);
    if (!contact.email.trim() || !contact.email.includes("@")) {
      setContactError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (!contact.phone.trim() || contact.phone.trim().length < 7) {
      setContactError("Por favor ingresa un número de teléfono de contacto (mínimo 7 dígitos).");
      return;
    }
    setStep(2);
  }

  // Selección de dirección guardada
  function handleSelectSavedAddress(addr: MockAddress) {
    setSelectedAddressId(addr.id);
    const parts = (customer?.name || "Cliente").split(" ");
    setShipping({
      firstName: shipping.firstName || parts[0] || "",
      lastName: shipping.lastName || parts.slice(1).join(" ") || "",
      address: addr.line1 || addr.line,
      line2: addr.line2 || "",
      city: addr.city || "Bogotá",
      region: addr.state || "Cundinamarca",
      zip: addr.postalCode || "",
    });
    setShippingError(null);
  }

  // Validación y paso siguiente de Dirección
  function handleContinueFromShipping() {
    setShippingError(null);
    if (!shipping.firstName.trim()) {
      setShippingError("Por favor ingresa tu nombre de receptor.");
      return;
    }
    if (!shipping.address.trim() || shipping.address.trim().length < 3) {
      setShippingError("Por favor ingresa la dirección de entrega.");
      return;
    }
    if (!shipping.region.trim()) {
      setShippingError("Por favor selecciona el departamento de entrega.");
      return;
    }
    if (!shipping.city.trim() || shipping.city.trim().length < 2) {
      setShippingError("Por favor selecciona o especifica la ciudad.");
      return;
    }
    setStep(3);
  }

  // Función de cupones
  function handleApplyCoupon(code: string) {
    if (code === "BIENVENIDO") {
      const discountCents = Math.round(cart.subtotalCents * 0.1);
      setAppliedDiscount({ code, percent: 10, discountCents });
      return { success: true, message: "¡Cupón aplicado! 10% de descuento en tu café." };
    }
    if (code === "BESTCOFFEE") {
      const discountCents = Math.round(cart.subtotalCents * 0.15);
      setAppliedDiscount({ code, percent: 15, discountCents });
      return { success: true, message: "¡Cupón aplicado! 15% de descuento especial." };
    }
    if (code === "ENVIOGRATIS") {
      setAppliedDiscount({ code, percent: 0, discountCents: 0 });
      return { success: true, message: "¡Envío gratis aplicado a tu orden!" };
    }
    return { success: false, message: "Código no reconocido o expirado." };
  }

  // Token de MercadoPago
  const handleMpToken = async (mpData: MpPaymentData) => {
    await submitOrder(mpData);
  };

  // Pago ordinario
  const handlePlainPay = async () => {
    if (paymentMethod === "card") {
      if (cardData.number.replace(/\s/g, "").length < 15) {
        setPayError("Por favor ingresa un número de tarjeta válido.");
        return;
      }
      if (!cardData.expiry || !cardData.expiry.includes("/")) {
        setPayError("Por favor ingresa la fecha de vencimiento (MM/AA).");
        return;
      }
      if (cardData.cvc.length < 3) {
        setPayError("Por favor ingresa el código de seguridad CVC.");
        return;
      }
    } else if (paymentMethod === "pse") {
      if (!pseData.idNumber.trim()) {
        setPayError("Por favor ingresa tu número de identificación para PSE.");
        return;
      }
    }

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
      discountCode: appliedDiscount?.code,
      paymentMethod,
    });

    setPlacing(false);
    if ("error" in result) {
      setPayError(result.error);
      return;
    }

    cart.clear();
    router.push(`/checkout/confirmacion?orderId=${encodeURIComponent(result.orderId)}`);
  };

  const isMp = paymentProvider === "mercadopago" && !!mpPublicKey;

  // Estado Carrito Vacío
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto size-16 rounded-full bg-muted grid place-items-center mb-6 text-muted-foreground">
          <ShoppingBag className="size-8" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Para proceder con el pago, agrega cafés en grano, mezclas de temporada o una suscripción desde nuestro catálogo.
        </p>
        <div className="mt-8">
          <Link href="/catalogo">
            <Button size="lg" className="gap-2">
              Explorar cafés disponibles <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_400px] gap-12">
      <div className="space-y-5">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          ← Continuar comprando
        </Link>

        {/* ── Step 1: Contacto ── */}
        <StepBlock
          n={1}
          title="Información de contacto"
          state={step === 1 ? "open" : step > 1 ? "done" : "todo"}
          onEdit={() => setStep(1)}
          collapsedSummary={`${contact.email} · ${contact.phone}`}
        >
          {customer && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-foreground">
              <User className="size-4 text-primary" />
              <span>
                Comprando como <strong>{customer.name || customer.email}</strong>
              </span>
            </div>
          )}

          {contactError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{contactError}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Correo electrónico"
              value={contact.email}
              onChange={(v) => {
                setContact({ ...contact, email: v });
                setContactError(null);
              }}
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
            />
            <Field
              label="Teléfono de contacto"
              value={contact.phone}
              onChange={(v) => {
                setContact({ ...contact, phone: v });
                setContactError(null);
              }}
              type="tel"
              autoComplete="tel"
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            {!customer && (
              <span className="text-xs text-muted-foreground">
                ¿Tienes cuenta?{" "}
                <Link href="/login?next=/checkout" className="text-primary hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </span>
            )}
            <Button className="ml-auto" onClick={handleContinueFromContact}>
              Continuar a envío →
            </Button>
          </div>
        </StepBlock>

        {/* ── Step 2: Dirección de Envío ── */}
        <StepBlock
          n={2}
          title="Dirección de entrega"
          state={step === 2 ? "open" : step > 2 ? "done" : "todo"}
          onEdit={() => setStep(2)}
          collapsedSummary={`${shipping.address}${shipping.line2 ? `, ${shipping.line2}` : ""}, ${shipping.city}`}
        >
          {/* Si el cliente tiene direcciones guardadas */}
          {savedAddresses.length > 0 && (
            <div className="mb-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Direcciones guardadas en tu cuenta:
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={
                        "rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between text-left " +
                        (isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-foreground/30")
                      }
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          <MapPin className="size-3.5 text-primary" />
                          <span>{addr.label || "Dirección"}</span>
                        </div>
                        {addr.isDefault && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal">
                            Predeterminada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">
                        {addr.line1 || addr.line}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[addr.line2, addr.city, addr.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAddressId("custom")}
                  className={
                    "text-xs font-medium inline-flex items-center gap-1.5 transition-colors " +
                    (selectedAddressId === "custom"
                      ? "text-primary font-semibold underline"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  <Plus className="size-3.5" />
                  Ingresar una dirección diferente
                </button>
              </div>
            </div>
          )}

          {shippingError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{shippingError}</span>
            </div>
          )}

          {/* Formulario de dirección */}
          {(savedAddresses.length === 0 || selectedAddressId === "custom") && (
            <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
              <Field
                label="Nombre"
                value={shipping.firstName}
                onChange={(v) => {
                  setShipping({ ...shipping, firstName: v });
                  setShippingError(null);
                }}
                autoComplete="given-name"
                placeholder="Nombre"
              />
              <Field
                label="Apellido"
                value={shipping.lastName}
                onChange={(v) => setShipping({ ...shipping, lastName: v })}
                autoComplete="family-name"
                placeholder="Apellido"
              />
              <Field
                className="sm:col-span-2"
                label="Dirección (Calle, Carrera, Número)"
                value={shipping.address}
                onChange={(v) => {
                  setShipping({ ...shipping, address: v });
                  setShippingError(null);
                }}
                autoComplete="street-address"
                placeholder="Ej. Calle 10 # 43E - 12"
              />
              <Field
                className="sm:col-span-2"
                label="Apartamento, interior, edificio (opcional)"
                value={shipping.line2}
                onChange={(v) => setShipping({ ...shipping, line2: v })}
                placeholder="Ej. Apto 502, Torre 1"
              />
              <ColombiaLocationSelector
                department={shipping.region}
                city={shipping.city}
                onDepartmentChange={(region) => {
                  setShipping((prev) => ({ ...prev, region }));
                  setShippingError(null);
                }}
                onCityChange={(city) => {
                  setShipping((prev) => ({ ...prev, city }));
                  setShippingError(null);
                }}
                variant="checkout"
                departmentId="shipping-region"
                cityId="shipping-city"
              />
              <Field
                label="Código postal (opcional)"
                value={shipping.zip}
                onChange={(v) => setShipping({ ...shipping, zip: v })}
                placeholder="110111"
                autoComplete="postal-code"
              />
            </div>
          )}

          <Button className="mt-6 w-full sm:w-auto" onClick={handleContinueFromShipping}>
            Continuar a método de pago →
          </Button>
        </StepBlock>

        {/* ── Step 3: Método de Pago ── */}
        <StepBlock
          n={3}
          title="Método de pago"
          state={step === 3 ? "open" : "todo"}
          onEdit={() => setStep(3)}
        >
          <p className="text-xs text-muted-foreground mb-4">
            Transacción 100% segura con cifrado SSL de 256 bits.
          </p>

          {payError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{payError}</span>
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
            <div className="space-y-4">
              {/* Selector de métodos de pago */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={
                    "p-3 rounded-xl border flex flex-col items-center gap-2 text-center text-xs font-medium transition-all " +
                    (paymentMethod === "card"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border bg-card text-muted-foreground hover:text-foreground")
                  }
                >
                  <CreditCard className="size-5" />
                  <span>Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("pse")}
                  className={
                    "p-3 rounded-xl border flex flex-col items-center gap-2 text-center text-xs font-medium transition-all " +
                    (paymentMethod === "pse"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border bg-card text-muted-foreground hover:text-foreground")
                  }
                >
                  <Building2 className="size-5" />
                  <span>PSE / Bancos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash_on_delivery")}
                  className={
                    "p-3 rounded-xl border flex flex-col items-center gap-2 text-center text-xs font-medium transition-all " +
                    (paymentMethod === "cash_on_delivery"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border bg-card text-muted-foreground hover:text-foreground")
                  }
                >
                  <Banknote className="size-5" />
                  <span>Contra Entrega</span>
                </button>
              </div>

              {/* Campos condicionales por método */}
              {paymentMethod === "card" && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <Field
                    label="Número de tarjeta"
                    value={cardData.number}
                    onChange={(v) => {
                      const clean = v.replace(/\D/g, "").slice(0, 16);
                      const formatted = clean.match(/.{1,4}/g)?.join(" ") || clean;
                      setCardData({ ...cardData, number: formatted });
                      setPayError(null);
                    }}
                    placeholder="4500 0000 0000 0000"
                    autoComplete="cc-number"
                    inputMode="numeric"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Vencimiento"
                      value={cardData.expiry}
                      onChange={(v) => {
                        const clean = v.replace(/\D/g, "").slice(0, 4);
                        const formatted = clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
                        setCardData({ ...cardData, expiry: formatted });
                      }}
                      placeholder="MM / AA"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                    />
                    <Field
                      label="CVC"
                      value={cardData.cvc}
                      onChange={(v) => {
                        const clean = v.replace(/\D/g, "").slice(0, 4);
                        setCardData({ ...cardData, cvc: clean });
                      }}
                      placeholder="123"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                  </div>
                  <Field
                    label="Nombre del titular"
                    value={cardData.name}
                    onChange={(v) => setCardData({ ...cardData, name: v })}
                    placeholder="Como aparece en la tarjeta"
                    autoComplete="cc-name"
                  />
                </div>
              )}

              {paymentMethod === "pse" && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                      Banco o Billetera
                    </span>
                    <select
                      value={pseData.bank}
                      onChange={(e) => setPseData({ ...pseData, bank: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    >
                      {COLOMBIAN_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                        Tipo Doc.
                      </span>
                      <select
                        value={pseData.idType}
                        onChange={(e) => setPseData({ ...pseData, idType: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                      >
                        <option value="CC">C.C.</option>
                        <option value="CE">C.E.</option>
                        <option value="NIT">NIT</option>
                        <option value="PP">Pasaporte</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Field
                        label="Número de identificación"
                        value={pseData.idNumber}
                        onChange={(v) => setPseData({ ...pseData, idNumber: v })}
                        placeholder="Ej. 1020304050"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Serás redirigido para autorizar el débito en la plataforma de tu banco.
                  </p>
                </div>
              )}

              {paymentMethod === "cash_on_delivery" && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Banknote className="size-4 text-primary" />
                    Pago en destino
                  </p>
                  <p>
                    Entrega tu pago en efectivo o mediante datáfono inalámbrico cuando recibas tu pedido en tu domicilio.
                  </p>
                  <p className="text-[11px] text-primary">
                    Disponible para despachos en Bogotá D.C. y Medellín.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            size="lg"
            className="mt-6 w-full h-12 text-base justify-center gap-2"
            disabled={placing}
            onClick={isMp ? submitMpForm : handlePlainPay}
          >
            {placing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando pedido...
              </>
            ) : (
              `Confirmar pedido y pagar`
            )}
          </Button>
        </StepBlock>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit">
        <OrderSummary
          appliedDiscount={appliedDiscount}
          onApplyDiscountCode={handleApplyCoupon}
          onRemoveDiscountCode={() => setAppliedDiscount(null)}
        />
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
    <section className="rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-shadow">
      <header
        className={
          "flex items-center gap-3 px-5 py-4 " +
          (state === "open" ? "border-b border-border bg-muted/20" : "")
        }
      >
        <span
          className={
            "size-7 rounded-full grid place-items-center text-xs font-semibold " +
            (state === "open"
              ? "bg-foreground text-background"
              : state === "done"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground")
          }
        >
          {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : n}
        </span>
        <h3 className="font-display text-lg font-semibold flex-1 tracking-tight">
          {title}
        </h3>
        {state === "done" && onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-primary underline-offset-2 hover:underline font-medium"
          >
            Editar
          </button>
        )}
        {state === "todo" && <ChevronDown className="size-4 text-muted-foreground" />}
      </header>
      {state === "open" && <div className="px-5 py-5">{children}</div>}
      {state === "done" && collapsedSummary && (
        <div className="px-5 pb-4 text-xs text-muted-foreground">
          {collapsedSummary}
        </div>
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
  autoComplete,
  inputMode,
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
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring placeholder:text-muted-foreground"
      />
    </label>
  );
}
