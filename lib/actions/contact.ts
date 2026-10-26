"use server";

import { sendContactNotificationEmail } from "@/lib/email/resend";

export interface ContactActionState {
  success?: boolean;
  error?: string;
}

export async function sendContactMessageAction(
  _prev: ContactActionState | null,
  formData: FormData,
): Promise<ContactActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "Consulta general").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Por favor completa todos los campos requeridos." };
  }

  if (!email.includes("@")) {
    return { error: "Por favor ingresa un correo electrónico válido." };
  }

  try {
    const result = await sendContactNotificationEmail({
      name,
      email,
      subject,
      message,
    });

    if (!result.success && result.error && !result.error.includes("no configurada")) {
      return { error: `No se pudo enviar el correo: ${result.error}` };
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado al enviar el mensaje.";
    return { error: errorMsg };
  }
}

