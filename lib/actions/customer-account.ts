"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "../env";
import { customerFetch } from "../api/gateway";
import {
  clearCustomerSessionCookies,
  getCustomerSession,
} from "../auth/session-store";

export type ProfileActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

export async function updateCustomerProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const fullName = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  // Casilla desmarcada = no viene en el FormData.
  const newsletterOptIn = formData.has("newsletterOptIn");

  if (!fullName) {
    return { error: "El nombre completo es obligatorio." };
  }
  if (fullName.length > 120) {
    return { error: "El nombre es demasiado largo (máximo 120 caracteres)." };
  }
  if (phone.length > 40) {
    return { error: "El teléfono es demasiado largo (máximo 40 caracteres)." };
  }

  if (env.useMocks) {
    revalidatePath("/cuenta");
    revalidatePath("/cuenta/datos");
    return { success: true, message: "Tus datos han sido actualizados." };
  }

  const { token, isMockSession } = await getCustomerSession();
  if (!token) {
    return { error: "Tu sesión ha expirado. Inicia sesión nuevamente." };
  }

  if (!isMockSession) {
    // Solo los campos que el backend acepta (name, phone, newsletterOptIn).
    // Cualquier fallo se muestra: antes los 404/503 se ignoraban en silencio y
    // el cliente creía haber guardado cuando no se guardaba nada.
    const res = await customerFetch("/v1/customers/me", {
      method: "PATCH",
      persistSyncedSession: true,
      body: { name: fullName, phone, newsletterOptIn },
    });

    if (!res.ok) {
      return { error: res.error || "No se pudieron guardar los cambios." };
    }
  }

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/datos");
  return { success: true, message: "Tus datos han sido actualizados correctamente." };
}

export async function deleteCustomerAccountAction(): Promise<ProfileActionState> {
  if (!env.useMocks) {
    const { token, isMockSession } = await getCustomerSession();
    if (token && !isMockSession) {
      await customerFetch("/v1/customers/me", {
        method: "DELETE",
        persistSyncedSession: true,
      });
    }
  }

  const store = await cookies();
  clearCustomerSessionCookies(store);
  redirect("/login");
}

export type SubscriptionActionInput =
  | { action: "CHANGE_FREQUENCY"; frequencyDays: number }
  | { action: "PAUSE" }
  | { action: "RESUME" }
  | { action: "SKIP_NEXT" }
  | { action: "CANCEL" };

export async function updateSubscriptionAction(
  subscriptionId: string,
  input: SubscriptionActionInput,
): Promise<{ ok: boolean; message: string; status?: string; frequencyDays?: number }> {
  const messages: Record<SubscriptionActionInput["action"], string> = {
    CHANGE_FREQUENCY: "Frecuencia de entrega actualizada.",
    PAUSE: "Suscripción pausada.",
    RESUME: "Suscripción reactivada.",
    SKIP_NEXT: "Se saltará el próximo envío.",
    CANCEL: "Suscripción cancelada.",
  };

  if (env.useMocks) return { ok: true, message: messages[input.action] };

  const { token, isMockSession } = await getCustomerSession();
  if (!token) {
    return { ok: false, message: "No hay una sesión activa." };
  }
  if (isMockSession) return { ok: true, message: messages[input.action] };

  // Endpoints reales de CustomerSubscriptionsController.
  const id = encodeURIComponent(subscriptionId);
  const ACTION_PATH = {
    PAUSE: "pause",
    RESUME: "resume",
    SKIP_NEXT: "skip-next",
    CANCEL: "cancel",
  } as const;
  const res =
    input.action === "CHANGE_FREQUENCY"
      ? await customerFetch<{ status?: string; frequencyDays?: number }>(
          `/v1/subscriptions/${id}`,
          {
            method: "PATCH",
            persistSyncedSession: true,
            body: { frequencyDays: input.frequencyDays },
          },
        )
      : await customerFetch<{ status?: string; frequencyDays?: number }>(
          `/v1/subscriptions/${id}/${ACTION_PATH[input.action]}`,
          { method: "POST", persistSyncedSession: true },
        );

  if (!res.ok) {
    return { ok: false, message: res.error || "No se pudo actualizar la suscripción." };
  }

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/suscripciones");

  return {
    ok: true,
    message: messages[input.action],
    status: res.data?.status,
    frequencyDays: res.data?.frequencyDays,
  };
}
