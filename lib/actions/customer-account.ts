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

  if (!fullName) {
    return { error: "El nombre completo es obligatorio." };
  }

  const parts = fullName.split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || undefined;

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
    const res = await customerFetch("/v1/customers/me", {
      method: "PATCH",
      persistSyncedSession: true,
      body: {
        name: fullName,
        firstName,
        lastName,
        phone: phone || undefined,
      },
    });

    if (!res.ok && res.status !== 503 && res.status !== 404) {
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
): Promise<{ ok: boolean; message: string }> {
  if (!env.useMocks) {
    const { token, isMockSession } = await getCustomerSession();
    if (!token) {
      return { ok: false, message: "No hay una sesión activa." };
    }

    if (!isMockSession) {
      const payload: Record<string, unknown> = {};
      if (input.action === "CHANGE_FREQUENCY") {
        payload.frequencyDays = input.frequencyDays;
      } else if (input.action === "PAUSE") {
        payload.status = "PAUSED";
      } else if (input.action === "RESUME") {
        payload.status = "ACTIVE";
      } else if (input.action === "SKIP_NEXT") {
        payload.status = "SKIPPED_NEXT";
      } else if (input.action === "CANCEL") {
        payload.status = "CANCELLED";
      }

      const res = await customerFetch(
        `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        {
          method: "PATCH",
          persistSyncedSession: true,
          body: payload,
        },
      );

      if (!res.ok && res.status !== 503) {
        return { ok: false, message: res.error || "No se pudo actualizar la suscripción." };
      }
    }
  }

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/suscripciones");

  const messages: Record<SubscriptionActionInput["action"], string> = {
    CHANGE_FREQUENCY: "Frecuencia de entrega actualizada.",
    PAUSE: "Suscripción pausada.",
    RESUME: "Suscripción reactivada.",
    SKIP_NEXT: "Se saltará el próximo envío.",
    CANCEL: "Suscripción cancelada.",
  };

  return { ok: true, message: messages[input.action] };
}

