"use server";

import { revalidatePath } from "next/cache";
import { operatorFetch } from "../api/gateway";

// Server actions del panel del operador para responder a una propuesta de cambio
// de comisión. Usan la cookie httpOnly `bestcoffee-operator-session` (token de operador),
// vía el gateway `operatorFetch` que centraliza headers y manejo de errores.

export type CommissionDecision = { ok: true } | { ok: false; error: string };

async function postCommission(action: "accept" | "reject"): Promise<CommissionDecision> {
  const res = await operatorFetch(`/v1/admin/billing/commission/${action}`, {
    method: "POST",
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo procesar la solicitud." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function acceptCommissionAction(): Promise<CommissionDecision> {
  return postCommission("accept");
}

export async function rejectCommissionAction(): Promise<CommissionDecision> {
  return postCommission("reject");
}
