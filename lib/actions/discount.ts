"use server";

import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";

export interface DiscountPreview {
  code: string;
  /** Descuento calculado por el backend sobre los productos reales del carrito. */
  discountCents: number;
  /** % equivalente (solo informativo; 0 si no aplica o es monto fijo). */
  percent: number;
}

export type DiscountPreviewResult =
  | { ok: true; preview: DiscountPreview }
  | { ok: false; message: string };

interface PriceResponse {
  subtotalCents: number;
  discountCents: number;
  discount?: { code: string; valid: boolean; amountCents: number; reason?: string };
}

/**
 * Valida un código de descuento contra el backend (única fuente de verdad: es
 * el mismo cálculo que se cobra al crear la orden). Reemplaza los cupones que
 * antes estaban escritos a mano en el cliente.
 */
export async function previewDiscountCodeAction(input: {
  code: string;
  items: { variantId: string; qty: number }[];
  subscription: boolean;
}): Promise<DiscountPreviewResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Ingresa un código de descuento." };

  // Los productos de demostración (ids "v_…"/"mock_…") no existen en el backend.
  const real = input.items.filter(
    (i) => i.variantId && !i.variantId.startsWith("v_") && !i.variantId.startsWith("mock_"),
  );
  if (real.length === 0) {
    return { ok: false, message: "Este código no aplica a los productos de tu carrito." };
  }

  const tenantSlug = await resolveActiveTenantSlug();

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/cart/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant-Slug": tenantSlug },
      body: JSON.stringify({
        items: real.map((i) => ({ variantId: i.variantId, quantity: Math.max(1, i.qty) })),
        mode: input.subscription ? "SUBSCRIPTION" : "ONE_TIME",
        discountCode: code,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "No pudimos validar el código ahora. Intenta de nuevo." };
  }

  if (!res.ok) {
    return { ok: false, message: "No pudimos validar el código ahora. Intenta de nuevo." };
  }

  const data = (await res.json().catch(() => null)) as PriceResponse | null;
  const d = data?.discount;
  if (!data || !d || !d.valid || d.amountCents <= 0) {
    return { ok: false, message: d?.reason ? `${d.reason}.` : "Código no reconocido o expirado." };
  }

  const percent =
    data.subtotalCents > 0 ? Math.round((d.amountCents / data.subtotalCents) * 100) : 0;
  return { ok: true, preview: { code: d.code, discountCents: d.amountCents, percent } };
}
