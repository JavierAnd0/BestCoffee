"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "../env";

// Server actions del panel del operador para responder a una propuesta de cambio
// de comisión. Usan la cookie httpOnly `bestcoffee-session` (token de operador) +
// el slug del tenant resuelto por el middleware.

async function adminHeaders(): Promise<Record<string, string>> {
  const c = await cookies();
  const h = await headers();
  const token = c.get("bestcoffee-session")?.value;
  const tenantSlug =
    h.get("x-tenant-slug") ?? env.defaultTenantSlug;
  return {
    "Content-Type": "application/json",
    "X-Tenant-Slug": tenantSlug,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type CommissionDecision = { ok: true } | { ok: false; error: string };

async function postCommission(action: "accept" | "reject"): Promise<CommissionDecision> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/admin/billing/commission/${action}`, {
      method: "POST",
      headers: await adminHeaders(),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }
  if (!res.ok) {
    let message = "No se pudo procesar la solicitud.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body?.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: message };
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
