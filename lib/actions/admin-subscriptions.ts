"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { operatorFetch } from "../api/gateway";

// Mutaciones de suscripciones contra /v1/admin/subscriptions (rol TENANT_ORDERS).
// Rutas y cuerpos de AdminSubscriptionsController / UpdateSubscriptionDto.

export type AdminSubscriptionActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const idSchema = z.string().trim().min(1).max(64);

const ACTIONS = {
  pause: { path: "pause", message: "Suscripción pausada." },
  resume: { path: "resume", message: "Suscripción reanudada." },
  skipNext: { path: "skip-next", message: "Se saltó el próximo envío." },
  cancel: { path: "cancel", message: "Suscripción cancelada." },
} as const;

export type AdminSubscriptionAction = keyof typeof ACTIONS;

export async function runAdminSubscriptionAction(
  id: string,
  action: AdminSubscriptionAction,
): Promise<AdminSubscriptionActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success || !(action in ACTIONS)) {
    return { ok: false, error: "Acción no válida." };
  }
  const { path, message } = ACTIONS[action];
  const res = await operatorFetch(
    `/v1/admin/subscriptions/${encodeURIComponent(parsedId.data)}/${path}`,
    { method: "POST" },
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/suscripciones");
  return { ok: true, message };
}

const termsSchema = z
  .object({
    frequencyDays: z.number().int().min(7).max(365).optional(),
    discountPct: z.number().int().min(0).max(100).optional(),
  })
  .refine((v) => v.frequencyDays !== undefined || v.discountPct !== undefined, {
    message: "No hay cambios que guardar.",
  });

export async function updateAdminSubscriptionTermsAction(
  id: string,
  terms: { frequencyDays?: number; discountPct?: number },
): Promise<AdminSubscriptionActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = termsSchema.safeParse(terms);
  if (!parsedId.success) return { ok: false, error: "Suscripción no válida." };
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const res = await operatorFetch(
    `/v1/admin/subscriptions/${encodeURIComponent(parsedId.data)}`,
    { method: "PATCH", body: parsed.data },
  );
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/suscripciones");
  return { ok: true, message: "Suscripción actualizada." };
}
