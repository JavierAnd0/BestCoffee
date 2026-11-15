"use server";

import { revalidatePath } from "next/cache";
import { customerFetch } from "../api/gateway";
import { getCustomerSession } from "../auth/session-store";

export type AddressActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

export async function createAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  try {
    const { token } = await getCustomerSession();
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

    if (!line1) return { error: "La dirección principal es requerida." };
    if (!city) return { error: "La ciudad es requerida." };

    const res = await customerFetch("/v1/customers/me/addresses", {
      method: "POST",
      persistSyncedSession: true,
      body: {
        label,
        line1,
        line2,
        city,
        state,
        postalCode,
        country: "CO",
        phone,
        isDefault,
      },
    });

    if (!res.ok) {
      return { error: res.error || "No se pudo guardar la dirección. Intenta de nuevo." };
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
    const { token } = await getCustomerSession();
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

    if (!line1) return { error: "La dirección principal es requerida." };
    if (!city) return { error: "La ciudad es requerida." };

    const res = await customerFetch(`/v1/customers/me/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      persistSyncedSession: true,
      body: {
        label,
        line1,
        line2,
        city,
        state,
        postalCode,
        country: "CO",
        phone,
        isDefault,
      },
    });

    if (!res.ok) {
      return { error: res.error || "No se pudo actualizar la dirección." };
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
    const { token } = await getCustomerSession();
    if (!token) return { error: "No hay una sesión activa." };

    const res = await customerFetch(`/v1/customers/me/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      persistSyncedSession: true,
    });

    if (!res.ok) {
      return { error: res.error || "No se pudo eliminar la dirección." };
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
    const { token } = await getCustomerSession();
    if (!token) return { error: "No hay una sesión activa." };

    const res = await customerFetch(`/v1/customers/me/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      persistSyncedSession: true,
      body: { isDefault: true },
    });

    if (!res.ok) {
      return { error: res.error || "No se pudo establecer como predeterminada." };
    }

    revalidatePath("/cuenta/direcciones");
    return { success: true, message: "Dirección establecida como predeterminada." };
  } catch (err) {
    console.error("Error al marcar predeterminada:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}

