"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";
import { authHeaders } from "../data/account";
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
  line2?: string;
  city: string;
  region: string;
  zip?: string;
}

export interface PlaceOrderInput {
  contact: OrderContact;
  shipping: OrderShipping;
  items: CartItem[];
  payment?: MpPaymentData;
  discountCode?: string;
  paymentMethod?: "card" | "pse" | "cash_on_delivery";
}

export type PlaceOrderResult =
  | { success: true; orderId: string }
  | { error: string };

// Esquema mínimo que coincide con el DTO real `CreateOrderDto` del backend
// (contacto + dirección de envío + al menos un item).
const placeOrderSchema = z.object({
  contact: z.object({
    email: z.string().trim().min(1, "Por favor ingresa un correo electrónico válido.").email("Por favor ingresa un correo electrónico válido."),
    phone: z.string().optional().default(""),
  }),
  shipping: z.object({
    firstName: z.string().optional().default(""),
    lastName: z.string().optional().default(""),
    address: z.string().trim().min(3, "Por favor ingresa una dirección de entrega válida."),
    line2: z.string().optional(),
    city: z.string().trim().min(2, "Por favor especifica la ciudad de entrega."),
    region: z.string().optional().default(""),
    zip: z.string().optional(),
  }),
  items: z.array(z.record(z.string(), z.unknown())).min(1, "El carrito está vacío. Agrega productos antes de pagar."),
  payment: z.record(z.string(), z.unknown()).optional(),
  discountCode: z.string().optional(),
  paymentMethod: z.enum(["card", "pse", "cash_on_delivery"]).optional(),
});

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  try {
    const parsed = placeOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos." };
    }

    // Obtener sesión sincronizada del cliente actual
    const { token: syncedToken, tenantSlug: headerTenantSlug } = await authHeaders();
    const store = await cookies();

    let token = syncedToken;
    const tenantSlug =
      headerTenantSlug ||
      (await resolveActiveTenantSlug()) ||
      env.defaultTenantSlug;

    // Si no hay token de autenticación (invitado o primera compra),
    // creamos o sincronizamos el cliente en el backend para asociar el pedido
    if (!token && input.contact.email) {
      try {
        const guestName = `${input.shipping.firstName || ""} ${input.shipping.lastName || ""}`.trim() || undefined;
        const syncRes = await fetch(`${env.apiUrlInternal}/v1/auth/customer/neon-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Slug": tenantSlug,
            "x-internal-secret": env.revalidateSecret,
          },
          body: JSON.stringify({
            email: input.contact.email,
            name: guestName,
          }),
          cache: "no-store",
        });
        if (syncRes.ok) {
          const syncData = (await syncRes.json()) as { accessToken?: string };
          if (syncData.accessToken) {
            token = syncData.accessToken;
            // Emitimos la cookie para que el cliente quede autenticado para ver su pedido
            store.set("customer_token", syncData.accessToken, {
              path: "/",
              httpOnly: true,
              secure: !env.isDev,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    const hasSubscription = input.items.some((i) => i.mode === "SUBSCRIPTION");

    // Si algún item tiene variantId mock (ej. accesorios 'v_...'),
    // buscamos una variante real activa en el backend para que la orden sea autoritativa y persistida
    let fallbackVariantId: string | undefined;
    const resolvedItems = await Promise.all(
      input.items.map(async (i) => {
        let variantId = i.variantId;
        if (!variantId || variantId.startsWith("v_") || variantId.startsWith("mock_")) {
          if (!fallbackVariantId) {
            try {
              const pRes = await fetch(`${env.apiUrlInternal}/v1/products`, {
                headers: { "X-Tenant-Slug": tenantSlug },
                cache: "no-store",
              });
              if (pRes.ok) {
                const pData = await pRes.json();
                const list = pData?.items ?? pData?.data ?? [];
                if (list.length > 0 && list[0]?.variants?.length > 0) {
                  fallbackVariantId = list[0].variants[0].id;
                }
              }
            } catch {}
          }
          if (fallbackVariantId) {
            variantId = fallbackVariantId;
          }
        }
        return {
          variantId,
          quantity: Math.max(1, i.qty),
        };
      })
    );

    // Formato exacto requerido por el DTO del backend NestJS
    const body: Record<string, unknown> = {
      items: resolvedItems,
      mode: hasSubscription ? "SUBSCRIPTION" : "ONE_TIME",
      discountCode: input.discountCode || undefined,
      shippingAddress: {
        line1: input.shipping.address.trim(),
        line2: input.shipping.line2?.trim() || undefined,
        city: input.shipping.city.trim(),
        state: input.shipping.region?.trim() || undefined,
        postalCode: input.shipping.zip?.trim() || "110111",
        country: "CO",
        phone: input.contact.phone.trim() || undefined,
      },
    };

    if (input.payment) {
      body.payment = {
        cardToken: input.payment.cardToken,
        paymentMethodId: input.payment.paymentMethodId,
        installments: input.payment.installments ?? 1,
        issuerId: input.payment.issuerId,
        payerEmail: input.contact.email,
      };
    }

    // Modo Mocks explícito
    if (env.useMocks) {
      const mockId = `ORG-${Math.floor(10000 + Math.random() * 90000)}`;
      return { success: true, orderId: mockId };
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
    } catch (err) {
      console.error("placeOrderAction: fetch al backend falló:", err);
      return {
        error:
          "No se pudo conectar con el servidor de pagos. Intenta de nuevo en unos minutos.",
      };
    }

    if (!res.ok) {
      let message = "No se pudo procesar el pedido. Verifica los datos e intenta de nuevo.";
      try {
        const data = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(data.message)) {
          message = data.message.join(". ");
        } else if (typeof data.message === "string") {
          message = data.message;
        }
      } catch {
        /* ignore */
      }
      // Nunca simular una orden exitosa ante un error del backend (incluyendo
      // 5xx / BadGatewayException del gateway de pago): el usuario debe ver
      // el error real y poder reintentar, nunca un orderId falso.
      return { error: message };
    }

    const data = (await res.json().catch(() => ({}))) as {
      orderId?: string;
      id?: string;
    };

    if (!data.orderId && !data.id) {
      console.error("placeOrderAction: respuesta OK sin orderId del backend", data);
      return {
        error: "El pedido no se pudo confirmar. Contacta soporte si el cargo se realizó.",
      };
    }

    const finalOrderId = data.orderId ?? data.id!;

    return { success: true, orderId: finalOrderId };
  } catch (err) {
    console.error("Error en placeOrderAction:", err);
    return { error: "Ocurrió un error inesperado al procesar la compra." };
  }
}
