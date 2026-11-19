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
    const line2 = String(formData.get("line2") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    const problem = addressFieldsProblem({ line1, line2, state, city, postalCode, phone });
    if (problem) return { error: problem };

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
    const line2 = String(formData.get("line2") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

    const problem = addressFieldsProblem({ line1, line2, state, city, postalCode, phone });
    if (problem) return { error: problem };

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

/** Todos los datos de envío son obligatorios (mismas reglas que el backend). */
function addressFieldsProblem(f: {
  line1: string;
  line2: string;
  state: string;
  city: string;
  postalCode: string;
  phone: string;
}): string | null {
  if (!f.line1) return "La dirección principal es requerida.";
  if (!f.line2) return "Indica apartamento, interior, torre o casa.";
  if (!f.state) return "El departamento es requerido.";
  if (!f.city) return "La ciudad es requerida.";
  if (!/^\d{6}$/.test(f.postalCode)) return "El código postal debe tener 6 dígitos.";
  if (f.phone.length < 7) return "Ingresa un teléfono de contacto (mínimo 7 dígitos).";
  return null;
}
