"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { operatorFetch } from "../api/gateway";
import type { AdminMutationResult } from "./admin-mutations";
import {
  mapAdminShipment,
  type AdminShipment,
  type ShipmentOverrides,
  type ShippingQuote,
} from "../shipping";

const overridesSchema = z.object({
  weightKg: z.number().min(0.1).max(150).optional(),
  lengthCm: z.number().int().min(1).max(200).optional(),
  widthCm: z.number().int().min(1).max(200).optional(),
  heightCm: z.number().int().min(1).max(200).optional(),
  destinationCityCode: z
    .string()
    .regex(/^\d{8}$/, "El código DANE tiene 8 dígitos (p. ej. 05001000).")
    .optional(),
  destinationStateCode: z
    .string()
    .regex(/^[A-Z]{2,3}$/, "El código de departamento son 2 letras (p. ej. AN).")
    .optional(),
});

const orderPath = (orderId: string) =>
  `/v1/admin/orders/${encodeURIComponent(orderId)}/shipping`;

/** Cotiza el envío del pedido con todas las transportadoras de Envia. */
export async function quoteShippingAction(
  orderId: string,
  overrides: ShipmentOverrides,
): Promise<AdminMutationResult<ShippingQuote>> {
  const parsed = overridesSchema.safeParse(overrides);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el paquete." };
  }
  const res = await operatorFetch<ShippingQuote>(`${orderPath(orderId)}/quotes`, {
    method: "POST",
    body: parsed.data,
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo cotizar el envío." };
  return { ok: true, message: "Cotización lista.", data: res.data };
}

const labelSchema = overridesSchema.extend({
  carrier: z.string().min(2).max(60),
  service: z.string().min(1).max(60),
  printSize: z.enum(["PAPER_4X6", "PAPER_LETTER"]).optional(),
});

/** Genera la guía (Envia la cobra del saldo de la tienda). */
export async function createShippingLabelAction(
  orderId: string,
  input: ShipmentOverrides & { carrier: string; service: string; printSize?: "PAPER_4X6" | "PAPER_LETTER" },
): Promise<AdminMutationResult<AdminShipment>> {
  const parsed = labelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Elige una tarifa." };
  }
  const res = await operatorFetch<Record<string, unknown>>(`${orderPath(orderId)}/label`, {
    method: "POST",
    body: parsed.data,
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo generar la guía." };
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  return { ok: true, message: "Guía generada.", data: mapAdminShipment(res.data) };
}

/** Anula la guía activa (solo si la transportadora aún no la recogió). */
export async function cancelShippingLabelAction(
  orderId: string,
): Promise<AdminMutationResult<AdminShipment>> {
  const res = await operatorFetch<Record<string, unknown>>(
    `${orderPath(orderId)}/label/cancel`,
    { method: "POST" },
  );
  if (!res.ok) return { ok: false, error: res.error || "No se pudo anular la guía." };
  revalidatePath(`/admin/pedidos/${orderId}`);
  return {
    ok: true,
    message: "Guía anulada. Envia devuelve el valor a tu saldo según la transportadora.",
    data: mapAdminShipment(res.data),
  };
}

const connectionSchema = z.object({
  token: z.string().trim().optional(),
  webhookSecret: z.string().trim().optional(),
  test: z.boolean(),
  origin: z.object({
    name: z.string().trim().min(2, "Escribe el nombre del remitente."),
    company: z.string().trim().optional(),
    phone: z.string().trim().min(7, "Escribe un teléfono de contacto."),
    email: z.string().trim().email("Correo inválido.").optional().or(z.literal("")),
    street: z.string().trim().min(3, "Escribe la dirección de despacho."),
    reference: z.string().trim().optional(),
    city: z.string().trim().min(2, "Elige la ciudad de despacho."),
    state: z.string().trim().min(2, "Elige el departamento de despacho."),
    identificationNumber: z.string().trim().optional(),
  }),
  package: z.object({
    lengthCm: z.number().int().min(1).max(200),
    widthCm: z.number().int().min(1).max(200),
    heightCm: z.number().int().min(1).max(200),
    packagingGrams: z.number().int().min(0).max(5000),
  }),
});

export type EnviaConnectionInput = z.input<typeof connectionSchema>;

/** Conecta o actualiza la cuenta de Envia; el backend prueba el token antes. */
export async function saveEnviaConnectionAction(
  input: EnviaConnectionInput,
): Promise<AdminMutationResult> {
  const parsed = connectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const { token, webhookSecret, origin, ...rest } = parsed.data;
  // Campos vacíos no se mandan: el backend los rechaza (y un token vacío
  // significa "conservar el que ya está guardado").
  const clean = Object.fromEntries(
    Object.entries(origin).filter(([, v]) => v !== "" && v !== undefined),
  );
  const res = await operatorFetch("/v1/admin/shipping/envia", {
    method: "PUT",
    body: {
      ...rest,
      origin: clean,
      ...(token ? { token } : {}),
      ...(webhookSecret !== undefined && webhookSecret !== "" ? { webhookSecret } : {}),
    },
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo conectar Envia." };
  revalidatePath("/admin/configuracion");
  return {
    ok: true,
    message: parsed.data.test
      ? "Envia conectado en modo de pruebas: las guías no se despachan de verdad."
      : "Envia conectado: ya puedes generar guías desde cada pedido.",
  };
}

export async function disconnectEnviaAction(): Promise<AdminMutationResult> {
  const res = await operatorFetch("/v1/admin/shipping/envia/disconnect", { method: "POST" });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo desconectar Envia." };
  revalidatePath("/admin/configuracion");
  return { ok: true, message: "Envia desconectado." };
}
