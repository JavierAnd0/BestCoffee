"use client";

/**
 * Abre la pasarela de ePayco (Checkout v2) con la sesión que creó el backend.
 *
 * `type: "standard"` lleva al comprador a la página de ePayco (como Checkout
 * Pro de MercadoPago) y, al terminar, ePayco lo devuelve a la confirmación de
 * la tienda con `?ref_payco=…`, donde se consulta el estado real.
 */

const SCRIPT_SRC = "https://checkout.epayco.co/checkout-v2.js";

type EpaycoCheckoutHandle = { open: () => void };
type EpaycoGlobal = {
  checkout: {
    configure: (opts: {
      sessionId: string;
      type: "standard" | "onpage";
      test: boolean;
    }) => EpaycoCheckoutHandle;
  };
};

declare global {
  interface Window {
    ePayco?: EpaycoGlobal;
  }
}

let loading: Promise<EpaycoGlobal> | null = null;

function loadEpayco(): Promise<EpaycoGlobal> {
  if (window.ePayco) return Promise.resolve(window.ePayco);
  if (loading) return loading;
  loading = new Promise<EpaycoGlobal>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.ePayco ? resolve(window.ePayco) : reject(new Error("ePayco no cargó"));
    script.onerror = () => reject(new Error("No se pudo cargar ePayco"));
    document.head.appendChild(script);
  }).catch((err: unknown) => {
    loading = null; // permite reintentar
    throw err;
  });
  return loading;
}

export async function openEpaycoCheckout(session: {
  sessionId: string;
  test: boolean;
}): Promise<void> {
  const ePayco = await loadEpayco();
  ePayco.checkout
    .configure({ sessionId: session.sessionId, type: "standard", test: session.test })
    .open();
}
