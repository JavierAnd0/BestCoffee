"use server";

import { cookies } from "next/headers";
import { env } from "../env";
import type { CartItem } from "@/components/storefront/cart-context";
import type { MpPaymentData } from "@/components/storefront/mercadopago-fields";

export interface OrderContact {
  email: string;
  phone: string;
}

export interface OrderShipping {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  region: string;
  zip?: string;
}

export interface PlaceOrderInput {
  contact: OrderContact;
  shipping: OrderShipping;
  items: CartItem[];
  payment?: MpPaymentData;
}

export type PlaceOrderResult =
  | { success: true; orderId: string }
  | { error: string };

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const store = await cookies();
  const token =
    store.get("bestcoffee-session")?.value ??
    store.get("customer_token")?.value;

  const tenantSlug = env.defaultTenantSlug;

  const body: Record<string, unknown> = {
    customerEmail: input.contact.email,
    customerPhone: input.contact.phone,
    shippingAddress: {
      firstName: input.shipping.firstName,
      lastName: input.shipping.lastName,
      address: input.shipping.address,
      city: input.shipping.city,
      region: input.shipping.region,
      zip: input.shipping.zip ?? "",
    },
    items: input.items.map((i) => ({
      variantId: i.variantId,
      qty: i.qty,
      mode: i.mode,
      frequencyDays: i.frequencyDays,
    })),
  };

  if (input.payment) {
    body.payment = {
      cardToken: input.payment.cardToken,
      paymentMethodId: input.payment.paymentMethodId,
      installments: input.payment.installments,
      issuerId: input.payment.issuerId,
    };
  }

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
              Cookie: `customer_token=${token}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    let message = "No se pudo crear el pedido. Intenta de nuevo.";
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message[0];
      else if (typeof data.message === "string") message = data.message;
    } catch { /* ignore */ }
    return { error: message };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string; orderId?: string };
  return { success: true, orderId: data.id ?? data.orderId ?? "desconocido" };
}
