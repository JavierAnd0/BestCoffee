"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "../env";

// Server actions para el panel de superadmin. Corren en el servidor, leen la
// cookie httpOnly `bestcoffee-session` y la reenvían como `Authorization: Bearer`
// — que es lo único que lee el PlatformGuard del backend. El token nunca se
// expone al JavaScript del navegador.

async function platformAuthHeader(): Promise<Record<string, string>> {
  const store = await cookies();
  const token = store.get("bestcoffee-session")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  tier: string;
  ownerEmail: string;
  ownerName?: string;
  domain?: string;
}

export type CreateTenantState =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

export async function createTenantAction(
  input: CreateTenantInput,
): Promise<CreateTenantState> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/platform/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await platformAuthHeader()),
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  if (!res.ok) {
    let message = "No se pudo crear el tenant.";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message[0];
      else if (typeof body.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: message };
  }

  const data = (await res.json()) as { id: string; slug: string };
  return { ok: true, id: data.id, slug: data.slug };
}

export interface UpdateTenantInput {
  tier?: string;
  features?: Record<string, unknown>;
  branding?: Record<string, unknown>;
}

export type UpdateTenantState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateTenantAction(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<UpdateTenantState> {
  let res: Response;
  try {
    res = await fetch(
      `${env.apiUrlInternal}/v1/platform/tenants/${tenantId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await platformAuthHeader()),
        },
        body: JSON.stringify(input),
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  if (!res.ok) {
    let message = "No se pudieron guardar los cambios.";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message[0];
      else if (typeof body.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: message };
  }

  revalidatePath(`/platform/superadmin/tenants/${tenantId}`);
  return { ok: true };
}

export type ImpersonateState =
  | { ok: true; accessToken: string }
  | { ok: false; error: string };

export async function impersonateTenantAction(
  tenantId: string,
): Promise<ImpersonateState> {
  let res: Response;
  try {
    res = await fetch(
      `${env.apiUrlInternal}/v1/platform/tenants/${tenantId}/impersonate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await platformAuthHeader()),
        },
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  if (!res.ok) {
    return { ok: false, error: "No se pudo impersonar el tenant." };
  }

  const data = (await res.json()) as { accessToken: string };
  return { ok: true, accessToken: data.accessToken };
}
