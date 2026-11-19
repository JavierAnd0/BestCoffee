"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Loader2,
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

import { ColombiaLocationSelector } from "./colombia-location-selector";
import { findDepartmentForCity } from "@/lib/data/colombia";
import { placeOrderAction } from "@/lib/actions/order";
import { openEpaycoCheckout } from "@/lib/epayco-checkout";
import {
  PAYER_DOC_LABELS,
  PAYER_DOC_NUMBER,
  PAYER_DOC_TYPES,
  type PayerDocType,
} from "@/lib/payer-document";
import { previewDiscountCodeAction } from "@/lib/actions/discount";
import { formatCop } from "@/lib/format";
import {
  contactProblem,
  loadCheckoutDraft,
  saveCheckoutDraft,
  shippingProblem,
} from "./checkout-draft";
import type { MockAddress, MockCustomer } from "@/lib/mocks/account";

type Step = 1 | 2 | 3;

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


// Medios que ofrece Checkout Pro en Colombia (los habilita MercadoPago según
// la cuenta de la tienda; esto es solo la guía para el comprador).
const MP_METHODS = ["Tarjeta crédito", "Tarjeta débito", "PSE", "Nequi", "Efecty", "Saldo MercadoPago"];

// Medios habituales de ePayco en Colombia (los habilita ePayco según la cuenta).
const EPAYCO_METHODS = ["Tarjeta crédito", "Tarjeta débito", "PSE", "Daviplata", "Efecty", "Baloto"];

/**
 * Nombre real de la cuenta para prellenar quién recibe. La cuenta sin nombre
 * llega con el texto de relleno "Cliente" (ver getCurrentCustomer): ese no es
 * un nombre, y prellenarlo terminaba en pedidos y pagos a nombre de "Cliente".
 */
function buyerNameParts(customer?: MockCustomer | null): string[] {
  const name = customer?.name?.trim() ?? "";
  if (!name || name === "Cliente") return [];
  return name.split(/\s+/);
}

export function CheckoutWizard({
  paymentProvider,
  mpPublicKey,
  useMocks = false,
  onlinePayments = true,
  customer,
  savedAddresses = [],
  canSubscribe = true,
}: {
  paymentProvider?: string | null;
  mpPublicKey?: string | null;
  useMocks?: boolean;
  /** false = la tienda recibe pedidos y cobra por fuera (sin pasarela). */
  onlinePayments?: boolean;
  customer?: MockCustomer | null;
  savedAddresses?: MockAddress[];
  /** La tienda ofrece suscripciones (feature `subscriptions` del plan). */
  canSubscribe?: boolean;
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
      const parts = buyerNameParts(customer);
      return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        address: defaultAddress.line1 || defaultAddress.line,
        line2: defaultAddress.line2 || "",
        city: defaultAddress.city || "",
        region: defaultAddress.state || findDepartmentForCity(defaultAddress.city ?? "") || "",
        zip: defaultAddress.postalCode || "",
      };
    }
    if (useMocks) return SEED_SHIPPING;
    const parts = buyerNameParts(customer);
    return {
      ...EMPTY_SHIPPING,
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  });

  // Estados de validación de pasos
  const [contactError, setContactError] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Cupón de descuento aplicado
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
    discountCents: number;
  } | null>(null);

  const [payError, setPayError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  // Camino a MercadoPago: el botón queda ocupado hasta que cambie la página.
  const [redirecting, setRedirecting] = useState(false);
  // Documento de quien paga (ePayco lo pide para tarjeta y PSE). Solo vive en
  // memoria: no va al borrador del checkout ni se guarda en el pedido.
  const [payerDoc, setPayerDoc] = useState<{ type: PayerDocType; number: string }>({
    type: "CC",
    number: "",
  });

  // ── Borrador: retomar el checkout donde quedó ──────────────────────────
  // Si el comprador sale (o vuelve de MercadoPago sin pagar), al regresar
  // encuentra sus datos y el paso en que iba.
  const draftOwner = customer?.email ?? null;
  const [draftReady, setDraftReady] = useState(false);
  const [resumed, setResumed] = useState(false);
  const pendingCoupon = useRef<string | null>(null);

  useEffect(() => {
    const draft = loadCheckoutDraft(cart.tenantSlug, draftOwner);
    queueMicrotask(() => {
      if (draft) {
        const savedId = draft.selectedAddressId;
        const addressOk =
          savedId === "custom" || savedAddresses.some((a) => a.id === savedId);
        // El correo de una cuenta no se cambia desde el borrador.
        const nextContact = customer?.email
          ? { ...draft.contact, email: customer.email }
          : draft.contact;
        setContact(nextContact);
        if (addressOk) {
          setSelectedAddressId(savedId);
          setShipping(draft.shipping);
        }
        // Solo se retoma un paso si los anteriores siguen completos.
        const shippingNow = addressOk ? draft.shipping : shipping;
        let nextStep: Step = 1;
        if (draft.step >= 2 && !contactProblem(nextContact)) nextStep = 2;
        if (nextStep === 2 && draft.step === 3 && !shippingProblem(shippingNow)) nextStep = 3;
        setStep(nextStep);
        setResumed(nextStep > 1);
        pendingCoupon.current = draft.discountCode;
      }
      setDraftReady(true);
    });
    // Solo al montar: después manda lo que escribe el comprador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveCheckoutDraft(cart.tenantSlug, draftOwner, {
      step,
      contact,
      shipping,
      selectedAddressId,
      discountCode: appliedDiscount?.code ?? null,
    });
  }, [draftReady, cart.tenantSlug, draftOwner, step, contact, shipping, selectedAddressId, appliedDiscount]);

  // Validación y paso siguiente de Contacto
  function handleContinueFromContact() {
    const problem = contactProblem(contact);
    setContactError(problem);
    if (!problem) setStep(2);
  }

  // Selección de dirección guardada
  function handleSelectSavedAddress(addr: MockAddress) {
    setSelectedAddressId(addr.id);
    const parts = buyerNameParts(customer);
    setShipping({
      firstName: shipping.firstName || parts[0] || "",
      lastName: shipping.lastName || parts.slice(1).join(" ") || "",
      address: addr.line1 || addr.line,
      line2: addr.line2 || "",
      city: addr.city || "",
      region: addr.state || findDepartmentForCity(addr.city ?? "") || "",
      zip: addr.postalCode || "",
    });
    setShippingError(null);
  }

  // Validación y paso siguiente de Dirección
  function handleContinueFromShipping() {
    const problem = shippingProblem(shipping);
    setShippingError(problem);
    // Una dirección guardada incompleta se abre en el formulario (ya
    // precargada) para que el comprador complete lo que falta.
    if (problem && selectedAddressId !== "custom") setSelectedAddressId("custom");
    if (!problem) setStep(3);
  }

  // Cupón del borrador: se vuelve a validar contra el backend cuando el carrito
  // ya cargó (puede haber vencido o dejado de aplicar).
  const cartReady = cart.items.length > 0;
  useEffect(() => {
    const code = pendingCoupon.current;
    if (!draftReady || !cartReady || !code) return;
    pendingCoupon.current = null;
    void handleApplyCoupon(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, cartReady]);

  // Cupones: el backend es la única fuente de verdad (el mismo cálculo que se
  // cobra al crear la orden). Ya no hay códigos escritos a mano en el cliente.
  async function handleApplyCoupon(code: string) {
    const res = await previewDiscountCodeAction({
      code,
      items: cart.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      subscription: cart.items.some((i) => i.mode === "SUBSCRIPTION"),
    });
    if (!res.ok) return { success: false, message: res.message };
    setAppliedDiscount(res.preview);
    return {
      success: true,
      message: res.preview.percent
        ? `¡Cupón aplicado! ${res.preview.percent}% de descuento.`
        : "¡Cupón aplicado!",
    };
  }

  // MercadoPago (Checkout Pro): se crea el pedido y se lleva al comprador a
  // pagar en MercadoPago. El carrito NO se vacía aquí: si no termina de pagar
  // y vuelve, lo encuentra igual; la confirmación lo vacía al volver.
  const handleMercadoPago = async () => {
    const result = await submitOrder("mercadopago");
    if (!result) return;
    if (result.checkoutUrl) {
      setRedirecting(true);
      window.location.assign(result.checkoutUrl);
      return;
    }
    // La tienda perdió la conexión con MercadoPago entre medias: el pedido
    // quedó con pago por fuera.
    goToConfirmation(result);
  };

  // ePayco (Checkout v2): igual que MercadoPago, se crea el pedido y se abre la
  // pasarela; ePayco devuelve al comprador a la confirmación con `ref_payco`.
  const handleEpayco = async () => {
    const number = payerDoc.number.trim();
    if (!PAYER_DOC_NUMBER.test(number)) {
      setPayError("Ingresa el número de documento de quien paga (4 a 15 letras o números).");
      return;
    }
    const result = await submitOrder("epayco", { type: payerDoc.type, number });
    if (!result) return;
    if (!result.epayco) {
      // La tienda desconectó ePayco entre medias: el pedido quedó manual.
      goToConfirmation(result);
      return;
    }
    setRedirecting(true);
    try {
      await openEpaycoCheckout(result.epayco);
    } catch {
      setRedirecting(false);
      setPayError(
        "No se pudo abrir la pasarela de ePayco. Revisa tu conexión (o un bloqueador de anuncios) e intenta de nuevo.",
      );
    }
  };

  // Pedido sin pago en línea: la tienda cobra por fuera.
  const handlePlainPay = async () => {
    const result = await submitOrder("manual");
    if (result) goToConfirmation(result);
  };

  type PlacedOrder = Extract<
    Awaited<ReturnType<typeof placeOrderAction>>,
    { success: true }
  >;

  const submitOrder = async (
    paymentMethod: "mercadopago" | "epayco" | "manual",
    payerDocument?: { type: PayerDocType; number: string },
  ): Promise<PlacedOrder | null> => {
    setPlacing(true);
    setPayError(null);

    const result = await placeOrderAction({
      contact,
      shipping,
      items: cart.items,
      discountCode: appliedDiscount?.code,
      paymentMethod,
      payerDocument,
    });

    setPlacing(false);
    if ("error" in result) {
      setPayError(result.error);
      return null;
    }
    return result;
  };

  const goToConfirmation = (result: PlacedOrder) => {
    cart.clear();
    const subsParam = result.subscriptionIds.length
      ? `&suscripciones=${encodeURIComponent(result.subscriptionIds.join(","))}`
      : "";
    router.push(
      `/checkout/confirmacion?orderId=${encodeURIComponent(result.orderId)}${subsParam}`,
    );
  };

  const isMp = onlinePayments && paymentProvider === "mercadopago" && !!mpPublicKey;
  const isEpayco = onlinePayments && !isMp && paymentProvider === "epayco";
  const gatewayName = isMp ? "MercadoPago" : isEpayco ? "ePayco" : null;

  // Total a cobrar, igual que el resumen: subtotal + envío − cupón. El backend
  // vuelve a cotizarlo; aquí solo sirve para las cuotas y los mínimos del Brick.
  const shippingCents =
    cart.subtotalCents >= cart.freeShippingThresholdCents ? 0 : cart.shippingFlatCents;
  const totalCents = Math.max(
    0,
    cart.subtotalCents + shippingCents - (appliedDiscount?.discountCents ?? 0),
  );

  // Una suscripción necesita cuenta propia (cobros recurrentes): un invitado
  // debe iniciar sesión antes de pagar, en vez de toparse con un error al final.
  const subItems = cart.items.filter((i) => i.mode === "SUBSCRIPTION");
  const hasSubscription = subItems.length > 0;
  const subscriptionNeedsLogin = !useMocks && !customer?.email && hasSubscription;
  // La tienda no ofrece suscripciones (plan): no se cobra el precio de
  // suscripción sin una suscripción real detrás.
  const subscriptionUnavailable = hasSubscription && !canSubscribe;
  // El pedido se cotiza en un solo modo: suscripción y compra única van aparte.
  const mixedCart = hasSubscription && subItems.length !== cart.items.length;
  const subscriptionBlocked = subscriptionUnavailable || mixedCart;

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

        {resumed && (
          <p
            role="status"
            className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground flex items-center justify-between gap-3"
          >
            <span>Retomamos tu compra donde la dejaste.</span>
            <button
              type="button"
              onClick={() => setResumed(false)}
              className="text-foreground underline-offset-2 hover:underline font-medium shrink-0"
            >
              Entendido
            </button>
          </p>
        )}

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
                required
              />
              <Field
                label="Apellido"
                value={shipping.lastName}
                onChange={(v) => {
                  setShipping({ ...shipping, lastName: v });
                  setShippingError(null);
                }}
                autoComplete="family-name"
                required
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
                required
              />
              <Field
                className="sm:col-span-2"
                label="Apartamento, interior, edificio"
                value={shipping.line2}
                onChange={(v) => {
                  setShipping({ ...shipping, line2: v });
                  setShippingError(null);
                }}
                autoComplete="address-line2"
                placeholder="Ej. Apto 502, Torre 1 · Casa"
                required
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
                label="Código postal"
                value={shipping.zip}
                onChange={(v) => {
                  setShipping({ ...shipping, zip: v.replace(/\D/g, "").slice(0, 6) });
                  setShippingError(null);
                }}
                placeholder="110111"
                autoComplete="postal-code"
                inputMode="numeric"
                required
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

          {payError && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          {isMp ? (
            <div
              role="radiogroup"
              aria-label="Medio de pago"
              className="space-y-3"
            >
              <div
                role="radio"
                aria-checked="true"
                className="rounded-xl border border-primary bg-primary/5 ring-1 ring-primary/20 p-4 flex items-start gap-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 rounded-full border-[5px] border-primary bg-background"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">MercadoPago</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Paga con lo que ya tienes en MercadoPago o con el medio que prefieras.
                    Si tienes cuenta, tus tarjetas guardadas aparecen listas para usar.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {MP_METHODS.map((m) => (
                      <li key={m}>
                        <Badge variant="outline" className="font-normal">
                          {m}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Te llevamos a MercadoPago para pagar de forma segura y vuelves aquí al terminar.
                Tu carrito se guarda por si no completas el pago.
              </p>
            </div>
          ) : isEpayco ? (
            <div role="radiogroup" aria-label="Medio de pago" className="space-y-3">
              <div
                role="radio"
                aria-checked="true"
                className="rounded-xl border border-primary bg-primary/5 ring-1 ring-primary/20 p-4 flex items-start gap-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 rounded-full border-[5px] border-primary bg-background"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">ePayco</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Paga con tarjeta, PSE o el medio que prefieras en la pasarela segura de ePayco.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {EPAYCO_METHODS.map((m) => (
                      <li key={m}>
                        <Badge variant="outline" className="font-normal">
                          {m}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <fieldset className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
                <legend className="mb-2 text-xs text-muted-foreground">
                  Documento de quien paga: ePayco lo pide para tarjeta y PSE y así no lo
                  escribes dos veces. No lo guardamos.
                </legend>
                <label className="block">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                    Tipo de documento <span className="text-destructive">*</span>
                  </span>
                  <select
                    value={payerDoc.type}
                    onChange={(e) => {
                      setPayerDoc({ ...payerDoc, type: e.target.value as PayerDocType });
                      setPayError(null);
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                  >
                    {PAYER_DOC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PAYER_DOC_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Número de documento"
                  value={payerDoc.number}
                  onChange={(v) => {
                    setPayerDoc({ ...payerDoc, number: v.replace(/[^0-9A-Za-z]/g, "").slice(0, 15) });
                    setPayError(null);
                  }}
                  placeholder="1020304050"
                  inputMode={payerDoc.type === "PPN" ? "text" : "numeric"}
                  autoComplete="off"
                  required
                />
              </fieldset>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Te llevamos a ePayco para pagar de forma segura y vuelves aquí al terminar.
                Tu carrito se guarda por si no completas el pago.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Banknote className="size-4 text-primary" />
                Pago al coordinar tu pedido
              </p>
              <p>
                Esta tienda no cobra en línea. Al confirmar recibimos tu pedido y te contactamos
                para acordar el pago (transferencia o contra entrega) y la entrega.
              </p>
            </div>
          )}

          {hasSubscription && !subscriptionBlocked && (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground text-sm">Cómo funciona tu suscripción</p>
              <ul className="space-y-1">
                {subItems.map((i) => (
                  <li key={i.variantId}>
                    {i.productName} · {i.variantLabel} · 1 unidad{" "}
                    {i.frequencyDays ? `cada ${i.frequencyDays / 7} sem` : "cada 30 días"}
                  </li>
                ))}
              </ul>
              <p>
                Este pedido es el primer envío. La suscripción se activa cuando se confirma su pago;
                después, cada envío genera un pedido nuevo que se paga igual que este
                {onlinePayments ? "" : " (la tienda te contacta para coordinar el pago)"}. Puedes
                pausarla, saltar un envío o cancelarla desde tu cuenta.
              </p>
            </div>
          )}

          {subscriptionUnavailable && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900"
            >
              Esta tienda no ofrece suscripciones. Quita del carrito los productos marcados como
              suscripción y agrégalos como compra única desde su ficha.
            </div>
          )}

          {mixedCart && !subscriptionUnavailable && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900"
            >
              Las suscripciones se piden por separado de las compras únicas. Quita de tu carrito
              los productos de compra única (o las suscripciones), confirma este pedido y luego
              haz el otro.
            </div>
          )}

          {subscriptionNeedsLogin && !subscriptionBlocked && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900"
            >
              Para suscribirte necesitas una cuenta.{" "}
              <a href="/login?next=/checkout" className="underline font-medium">
                Inicia sesión
              </a>{" "}
              o{" "}
              <a href="/registro" className="underline font-medium">
                crea tu cuenta
              </a>{" "}
              y vuelve aquí: tu carrito se conserva.
            </div>
          )}

          <Button
            size="lg"
            className="mt-6 w-full h-12 text-base justify-center gap-2"
            disabled={placing || redirecting || subscriptionNeedsLogin || subscriptionBlocked}
            onClick={isMp ? handleMercadoPago : isEpayco ? handleEpayco : handlePlainPay}
          >
            {placing || redirecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {gatewayName ? `Te llevamos a ${gatewayName}…` : "Procesando pedido..."}
              </>
            ) : gatewayName ? (
              <>
                Pagar {formatCop(totalCents)} con {gatewayName}
                <ArrowRight className="size-4" />
              </>
            ) : (
              "Confirmar pedido"
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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        required={required}
        aria-required={required}
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
