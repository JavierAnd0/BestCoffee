"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";
import { authHeaders } from "../data/account";

export type AddressActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

async function getAuthContext() {
  const { token, tenantSlug: headerTenantSlug } = await authHeaders();
  const c = await cookies();

  if (token && token !== "mock-session-test") {
    const existing = c.get("customer_token")?.value;
    if (existing !== token) {
      const cookieOpts = {
        path: "/",
        httpOnly: true,
        secure: !env.isDev,
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24 * 30,
      };
      c.set("customer_token", token, cookieOpts);
      c.set("bestcoffee-session", token, cookieOpts);
    }
  }

  const tenantSlug =
    headerTenantSlug ||
    (await resolveActiveTenantSlug()) ||
    env.defaultTenantSlug;

  return { token, tenantSlug };
}

export async function createAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  try {
    const { token, tenantSlug } = await getAuthContext();

    if (!token) {
      return { error: "No hay una sesión activa. Inicia sesión nuevamente." };
    }

    const line1 = String(formData.get("line1") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim() || "Casa";
    const line2 = String(formData.get("line2") ?? "").trim() || undefined;
    const state = String(formData.get("state") ?? "").trim() || undefined;
    const postalCode = String(formData.get("postalCode") ?? "").trim() || undefined;
    const phone = String(formData.get("phone") ?? "").trim() || undefined;
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    if (!line1) {
      return { error: "La dirección principal es requerida." };
    }
    if (!city) {
      return { error: "La ciudad es requerida." };
    }

    const payload = {
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      country: "CO",
      phone,
      isDefault,
    };

    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body.message.join(". ")
        : body?.message || "No se pudo guardar la dirección. Intenta de nuevo.";
      return { error: message };
    }

    revalidatePath("/cuenta/direcciones");
    return { success: true, message: "Dirección agregada correctamente." };
  } catch (err) {
    console.error("Error al crear dirección:", err);
    return { error: "Ocurrió un error inesperado al guardar la dirección." };
  }
}

export async function updateAddressAction(
  id: string,
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  try {
    const { token, tenantSlug } = await getAuthContext();

    if (!token) {
      return { error: "No hay una sesión activa. Inicia sesión nuevamente." };
    }

    const line1 = String(formData.get("line1") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim() || "Casa";
    const line2 = String(formData.get("line2") ?? "").trim() || undefined;
    const state = String(formData.get("state") ?? "").trim() || undefined;
    const postalCode = String(formData.get("postalCode") ?? "").trim() || undefined;
    const phone = String(formData.get("phone") ?? "").trim() || undefined;
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    if (!line1) {
      return { error: "La dirección principal es requerida." };
    }
    if (!city) {
      return { error: "La ciudad es requerida." };
    }

    const payload = {
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      country: "CO",
      phone,
      isDefault,
    };

    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body.message.join(". ")
        : body?.message || "No se pudo actualizar la dirección.";
      return { error: message };
    }

    revalidatePath("/cuenta/direcciones");
    return { success: true, message: "Dirección actualizada correctamente." };
  } catch (err) {
    console.error("Error al actualizar dirección:", err);
    return { error: "Ocurrió un error inesperado al actualizar la dirección." };
  }
}

export async function deleteAddressAction(id: string): Promise<AddressActionState> {
  try {
    const { token, tenantSlug } = await getAuthContext();

    if (!token) {
      return { error: "No hay una sesión activa." };
    }

    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses/${id}`, {
      method: "DELETE",
      headers: {
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok && res.status !== 204) {
      return { error: "No se pudo eliminar la dirección." };
    }

    revalidatePath("/cuenta/direcciones");
    return { success: true, message: "Dirección eliminada correctamente." };
  } catch (err) {
    console.error("Error al eliminar dirección:", err);
    return { error: "Ocurrió un error inesperado al eliminar la dirección." };
  }
}

export async function setDefaultAddressAction(id: string): Promise<AddressActionState> {
  try {
    const { token, tenantSlug } = await getAuthContext();

    if (!token) {
      return { error: "No hay una sesión activa." };
    }

    const res = await fetch(`${env.apiUrlInternal}/v1/customers/me/addresses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
        Authorization: `Bearer ${token}`,
        Cookie: `customer_token=${token}`,
      },
      body: JSON.stringify({ isDefault: true }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: "No se pudo establecer como predeterminada." };
    }

    revalidatePath("/cuenta/direcciones");
    return { success: true, message: "Dirección establecida como predeterminada." };
  } catch (err) {
    console.error("Error al marcar predeterminada:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}

