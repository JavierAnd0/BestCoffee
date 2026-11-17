"use server";

import { headers } from "next/headers";
import { sendContactNotificationEmail } from "@/lib/email/resend";
import { getCurrentTenant } from "@/lib/data/tenant";
import { clientIpFrom } from "@/lib/api/client-ip";

// Límite básico por IP (por instancia del servidor): el formulario envía correo
// directamente, sin pasar por la API.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return false;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return true;
}

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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { error: "Por favor ingresa un correo electrónico válido." };
  }
  if (name.length > 120 || subject.length > 200 || message.length > 5000) {
    return { error: "El mensaje es demasiado largo." };
  }

  const ip = clientIpFrom(await headers()) ?? "sin-ip";
  if (!allow(ip)) {
    return { error: "Enviaste varios mensajes seguidos. Intenta de nuevo en unos minutos." };
  }

  const tenant = await getCurrentTenant();

  try {
    const result = await sendContactNotificationEmail({
      name,
      email,
      subject,
      message,
      store: { name: tenant.brand, city: tenant.branding.city ?? null },
      recipient: tenant.branding.contactEmail ?? null,
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

