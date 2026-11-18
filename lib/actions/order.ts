"use server";

import { demoHeaders } from "../demo";
import { z } from "zod";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";
import { authHeaders } from "../data/account";
import type { CartItem } from "@/components/storefront/cart-context";
import { headers } from "next/headers";
import { clientIpHeaders } from "@/lib/api/client-ip";

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
  discountCode?: string;
  paymentMethod?: "mercadopago" | "manual";
}

export type PlaceOrderResult =
  | {
      success: true;
      orderId: string;
      /** Suscripciones creadas con el pedido (esperan su pago para activarse). */
      subscriptionIds: string[];
      /**
       * Página de pago de MercadoPago (Checkout Pro) a la que se lleva al
       * comprador. Ausente si el pedido es de pago por fuera (MANUAL).
       */
      checkoutUrl?: string;
    }
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
  discountCode: z.string().optional(),
  paymentMethod: z.enum(["mercadopago", "manual"]).optional(),
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

    const token = syncedToken;
    const tenantSlug =
      headerTenantSlug ||
      (await resolveActiveTenantSlug()) ||
      env.defaultTenantSlug;

    // Sin sesión = compra de invitado. NO se pide ni se guarda una sesión para
    // el correo del formulario: nadie ha verificado que sea de quien compra, y
    // hacerlo permitía entrar a la cuenta de otro cliente con solo escribir su
    // correo. El pedido se crea por el endpoint de invitado (más abajo).
    const guestName =
      `${input.shipping.firstName || ""} ${input.shipping.lastName || ""}`.trim() || undefined;

    const demoExtra = await demoHeaders();
    // El backend cotiza el pedido entero en un solo modo: un carrito que mezcla
    // suscripción y compra única cobraría la compra única a precio de
    // suscripción. Se piden por separado.
    const hasSubscription = input.items.some((i) => i.mode === "SUBSCRIPTION");
    if (hasSubscription && input.items.some((i) => i.mode !== "SUBSCRIPTION")) {
      return {
        error:
          "Las suscripciones se piden por separado de las compras únicas. Quita una de las dos del carrito.",
      };
    }
    if (hasSubscription && !token && !env.useMocks) {
      return { error: "Para suscribirte necesitas iniciar sesión o crear una cuenta." };
    }

    // Cada línea debe apuntar a una variante real. Antes, una línea sin variante
    // (o con un id de datos de ejemplo) se cambiaba por el primer producto del
    // catálogo: el cliente pagaba algo que no eligió. Ahora se rechaza.
    // (Con USE_MOCKS los ids de ejemplo son válidos: el pedido no llega al backend.)
    if (
      !env.useMocks &&
      input.items.some((i) => !i.variantId || /^(v_|mock_)/.test(i.variantId))
    ) {
      return {
        error:
          "Hay un producto en tu carrito que ya no está disponible. Quítalo y vuelve a agregarlo.",
      };
    }
    // En una suscripción cada línea es una suscripción de una unidad por envío
    // con su propia frecuencia (la que eligió en la ficha del producto).
    const resolvedItems = input.items.map((i) =>
      hasSubscription
        ? {
            variantId: i.variantId,
            quantity: 1,
            ...(i.frequencyDays ? { frequencyDays: i.frequencyDays } : {}),
          }
        : { variantId: i.variantId, quantity: Math.max(1, i.qty) },
    );

    // Formato exacto requerido por el DTO del backend NestJS
    const body: Record<string, unknown> = {
      items: resolvedItems,
      mode: hasSubscription ? "SUBSCRIPTION" : "ONE_TIME",
      discountCode: input.discountCode || undefined,
      shippingAddress: {
        recipientName: guestName,
        line1: input.shipping.address.trim(),
        line2: input.shipping.line2?.trim() || undefined,
        city: input.shipping.city.trim(),
        state: input.shipping.region?.trim() || undefined,
        // Sin código postal se envía vacío: nunca uno inventado (110111 es de Bogotá).
        postalCode: input.shipping.zip?.trim() || undefined,
        country: "CO",
        phone: input.contact.phone.trim() || undefined,
      },
    };

    // Origen de la tienda (su dominio) para volver de MercadoPago; el backend
    // solo lo acepta si es la web de la plataforma o un dominio verificado.
    const returnOrigin = await requestOrigin();
    if (returnOrigin) body.returnOrigin = returnOrigin;

    // Modo Mocks explícito
    if (env.useMocks) {
      const mockId = `ORG-${Math.floor(10000 + Math.random() * 90000)}`;
      return { success: true, orderId: mockId, subscriptionIds: [] };
    }

    let res: Response;
    try {
      res = token
        ? await fetch(`${env.apiUrlInternal}/v1/orders`, {
            method: "POST",
            headers: {
              ...(await clientIpHeaders()),
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
              ...demoExtra,
              Authorization: `Bearer ${token}`,
              Cookie: `customer_token=${token}`,
            },
            body: JSON.stringify(body),
            cache: "no-store",
          })
        : // Invitado: llamada servidor a servidor con el secreto interno. El
          // backend asocia el pedido al correo y no devuelve ninguna sesión.
          await fetch(`${env.apiUrlInternal}/v1/orders/guest`, {
            method: "POST",
            headers: {
              ...(await clientIpHeaders()),
              "Content-Type": "application/json",
              "X-Tenant-Slug": tenantSlug,
              ...demoExtra,
              "x-internal-secret": env.revalidateSecret,
            },
            body: JSON.stringify({
              ...body,
              email: parsed.data.contact.email,
              name: guestName,
            }),
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
      summary?: { subscriptionIds?: string[] };
      provider?: string;
      checkoutUrl?: string;
    };

    if (!data.orderId && !data.id) {
      console.error("placeOrderAction: respuesta OK sin orderId del backend", data);
      return {
        error: "El pedido no se pudo confirmar. Contacta soporte si el cargo se realizó.",
      };
    }

    const finalOrderId = data.orderId ?? data.id!;

    return {
      success: true,
      orderId: finalOrderId,
      subscriptionIds: data.summary?.subscriptionIds ?? [],
      ...(data.provider === "MERCADOPAGO" &&
        data.checkoutUrl && { checkoutUrl: data.checkoutUrl }),
    };
  } catch (err) {
    console.error("Error en placeOrderAction:", err);
    return { error: "Ocurrió un error inesperado al procesar la compra." };
  }
}

/** `https://host` de la petición en curso (detrás del proxy de Vercel). */
async function requestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host || !/^[a-zA-Z0-9.:-]+$/.test(host)) return null;
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
