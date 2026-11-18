"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";
import { clearCheckoutDraft } from "./checkout-draft";

/**
 * Vacía el carrito y borra el borrador del checkout al llegar a la
 * confirmación. Hace falta cuando el comprador vuelve de pagar en MercadoPago:
 * el checkout no los borra antes de mandarlo allá, por si no paga y vuelve.
 */
export function ClearCartOnMount() {
  const { clear, tenantSlug } = useCart();
  useEffect(() => {
    clear();
    clearCheckoutDraft(tenantSlug);
  }, [clear, tenantSlug]);
  return null;
}
