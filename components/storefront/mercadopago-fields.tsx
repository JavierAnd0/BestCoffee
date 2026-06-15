"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

// MercadoPago JS v2 minimal typings
declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      opts?: { locale?: string },
    ) => MpInstance;
  }
}

interface MpInstance {
  cardForm: (config: MpCardFormConfig) => MpCardForm;
}

interface MpCardFormConfig {
  amount: string;
  autoMount: boolean;
  form: {
    id: string;
    cardNumber: { id: string; placeholder?: string };
    expirationDate: { id: string; placeholder?: string };
    securityCode: { id: string; placeholder?: string };
    cardholderName: { id: string; placeholder?: string };
    issuer: { id: string };
    installments: { id: string };
  };
  callbacks: {
    onFormMounted?: (error: unknown) => void;
    onSubmit?: (event: Event) => void;
    onFetchingResource?: (resource: string, isLoading: boolean) => void;
  };
}

interface MpCardForm {
  getCardFormData: () => MpRawData;
  unmount: () => void;
}

interface MpRawData {
  token: string;
  payment_method_id: string;
  issuer_id: string;
  installments: string;
}

export interface MpPaymentData {
  cardToken: string;
  paymentMethodId: string;
  issuerId: string;
  installments: number;
}

const MP_SDK = "https://sdk.mercadopago.com/js/v2";

export function MercadoPagoFields({
  mpPublicKey,
  amountCents,
  onToken,
  onError,
}: {
  mpPublicKey: string;
  amountCents: number;
  onToken: (data: MpPaymentData) => void;
  onError: (msg: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const cardFormRef = useRef<MpCardForm | null>(null);

  const handleToken = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (!cardFormRef.current) return;
      try {
        const raw = cardFormRef.current.getCardFormData();
        if (!raw.token) {
          onError("No se pudo tokenizar la tarjeta. Verifica los datos.");
          return;
        }
        onToken({
          cardToken: raw.token,
          paymentMethodId: raw.payment_method_id,
          issuerId: raw.issuer_id,
          installments: parseInt(raw.installments, 10) || 1,
        });
      } catch {
        onError("Error al procesar la tarjeta. Intenta de nuevo.");
      }
    },
    [onToken, onError],
  );

  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    let form: MpCardForm | null = null;

    const init = () => {
      const mp = new window.MercadoPago(mpPublicKey, { locale: "es-CO" });
      form = mp.cardForm({
        amount: String((amountCents / 100).toFixed(2)),
        autoMount: true,
        form: {
          id: "mp-card-form",
          cardNumber: { id: "mp-card-number", placeholder: "Número de tarjeta" },
          expirationDate: { id: "mp-expiration-date", placeholder: "MM/YY" },
          securityCode: { id: "mp-security-code", placeholder: "CVC" },
          cardholderName: { id: "mp-cardholder-name", placeholder: "Titular de la tarjeta" },
          issuer: { id: "mp-issuer" },
          installments: { id: "mp-installments" },
        },
        callbacks: {
          onFormMounted: (err) => {
            if (!err) setMounted(true);
            else onError("No se pudo cargar el formulario de pago.");
          },
          onSubmit: handleToken,
        },
      });
      cardFormRef.current = form;
    };

    if (window.MercadoPago) {
      init();
    } else {
      script = document.createElement("script");
      script.src = MP_SDK;
      script.async = true;
      script.onload = init;
      script.onerror = () => onError("No se pudo cargar el SDK de MercadoPago.");
      document.head.appendChild(script);
    }

    return () => {
      form?.unmount();
      cardFormRef.current = null;
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpPublicKey]);

  return (
    <form id="mp-card-form" className="space-y-3">
      {!mounted && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando formulario de pago…
        </div>
      )}

      <div className={mounted ? "space-y-3" : "hidden"}>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Número de tarjeta
          </span>
          <div
            id="mp-card-number"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[38px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
              Vencimiento
            </span>
            <div
              id="mp-expiration-date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[38px]"
            />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
              CVC
            </span>
            <div
              id="mp-security-code"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[38px]"
            />
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Titular de la tarjeta
          </span>
          <div
            id="mp-cardholder-name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[38px]"
          />
        </div>

        {/* Hidden MP selects — MP populates these internally */}
        <select id="mp-issuer" className="hidden" />
        <select id="mp-installments" className="hidden" />
      </div>

      {/* Hidden submit button — triggered programmatically by the wizard */}
      <button type="submit" id="mp-submit-btn" className="hidden" />
    </form>
  );
}

/** Called by the wizard's "Confirmar y pagar" button to trigger MP tokenization */
export function submitMpForm() {
  document.getElementById("mp-submit-btn")?.click();
}
