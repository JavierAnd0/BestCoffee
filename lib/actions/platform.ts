"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { operatorFetch } from "../api/gateway";
import { tenantOrigin } from "../platform-urls";

// Server actions para el panel de superadmin. Corren en el servidor y usan el
// gateway `operatorFetch` (lee la cookie httpOnly `bestcoffee-operator-session`
// y la reenvía como `Authorization: Bearer`,
// que es lo único que lee el PlatformGuard del backend). El token nunca se
// expone al JavaScript del navegador.

/**
 * Siempre con la sesión propia del dueño de la plataforma: /v1/platform/* no
 * acepta la de impersonación, y una cookie de impersonación que quede en este
 * dominio (versiones anteriores la ponían aquí) haría fallar cada acción.
 */
async function platformAction<T = unknown>(
  path: string,
  init: Parameters<typeof operatorFetch>[1] = {},
) {
  const token = (await cookies()).get("bestcoffee-operator-session")?.value;
  return operatorFetch<T>(path, {
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  tier: string;
  ownerEmail: string;
  ownerName?: string;
  commissionEnabled?: boolean;
  commissionPct?: number;
}

export type CreateTenantState =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function createTenantAction(
  input: CreateTenantInput,
): Promise<CreateTenantState> {
  const res = await platformAction<{ id: string; slug: string }>(
    "/v1/platform/tenants",
    { method: "POST", body: input },
  );

  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo crear el tenant." };
  }

  return { ok: true, id: res.data.id, slug: res.data.slug };
}

export interface UpdateTenantInput {
  tier?: string;
  features?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  // Facturación (ISO strings o null para limpiar fechas)
  billingType?: string;
  billingStatus?: string;
  billingCycle?: string | null;
  billingStartedAt?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  hasMaintenance?: boolean;
  billingAmountCents?: number | null;
  commissionPct?: number;
}

export type UpdateTenantState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateTenantAction(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<UpdateTenantState> {
  const res = await platformAction(`/v1/platform/tenants/${tenantId}`, {
    method: "PATCH",
    body: input,
  });

  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudieron guardar los cambios." };
  }

  revalidatePath(`/platform/superadmin/tenants/${tenantId}`);
  return { ok: true };
}

export type ImpersonateState =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * "Entrar como admin" de una tienda. La tienda vive en otro dominio
 * (`<slug>.<dominio>`), donde una cookie puesta aquí no llega: el backend da un
 * pase de un minuto y la tienda lo canjea en `/acceso/impersonar`.
 */
export async function impersonateTenantAction(
  tenantId: string,
): Promise<ImpersonateState> {
  const res = await platformAction<{ handoffToken?: string; slug?: string }>(
    `/v1/platform/tenants/${tenantId}/impersonate`,
    { method: "POST" },
  );

  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo entrar a la tienda." };
  }
  const { handoffToken, slug } = res.data ?? {};
  if (!handoffToken || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "Respuesta inválida del servidor." };
  }

  const origin = await tenantOrigin(slug);
  return {
    ok: true,
    url: `${origin}/acceso/impersonar?token=${encodeURIComponent(handoffToken)}`,
  };
}

// ── Dominios propios de una tienda ───────────────────────────────────────────

export interface DomainVerification {
  type: "TXT";
  host: string;
  value: string;
}

export type DomainActionState =
  | { ok: true; domain?: string; verified?: boolean; verification?: DomainVerification; reason?: string }
  | { ok: false; error: string };

export async function addTenantDomainAction(
  tenantId: string,
  domain: string,
): Promise<DomainActionState> {
  const res = await platformAction<{ domain: string; verification: DomainVerification }>(
    `/v1/platform/tenants/${tenantId}/domains`,
    { method: "POST", body: { domain } },
  );
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo registrar el dominio." };
  }
  if (!res.data) return { ok: false, error: "Respuesta inválida del servidor." };
  revalidatePath(`/platform/superadmin/tenants/${tenantId}`);
  return { ok: true, domain: res.data.domain, verified: false, verification: res.data.verification };
}

export async function verifyTenantDomainAction(
  tenantId: string,
  domainId: string,
): Promise<DomainActionState> {
  const res = await platformAction<{
    domain: string;
    verified: boolean;
    reason?: string;
    verification: DomainVerification;
  }>(`/v1/platform/tenants/${tenantId}/domains/${domainId}/verify`, { method: "POST" });
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo verificar el dominio." };
  }
  if (!res.data) return { ok: false, error: "Respuesta inválida del servidor." };
  revalidatePath(`/platform/superadmin/tenants/${tenantId}`);
  return {
    ok: true,
    domain: res.data.domain,
    verified: res.data.verified,
    verification: res.data.verification,
    reason: res.data.reason,
  };
}

export async function removeTenantDomainAction(
  tenantId: string,
  domainId: string,
): Promise<DomainActionState> {
  const res = await platformAction(`/v1/platform/tenants/${tenantId}/domains/${domainId}`, {
    method: "DELETE",
  });
  if (!res.ok) return { ok: false, error: res.error || "No se pudo quitar el dominio." };
  revalidatePath(`/platform/superadmin/tenants/${tenantId}`);
  return { ok: true };
}
