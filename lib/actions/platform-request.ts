"use server";

import { headers } from "next/headers";
import { clientIpFrom } from "@/lib/api/client-ip";
import { DEMO_FEATURES, summarize, validContact, type DemoState } from "@/lib/demo-plan";
import { sendContactNotificationEmail } from "@/lib/email/resend";

// "Solicitar mi tienda" en la landing de la plataforma. Aún no hay alta
// automática (las tiendas las crea el superadmin), así que la solicitud llega
// por correo a PLATFORM_CONTACT_EMAIL con lo que el visitante armó.

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 3;
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

export interface StoreRequestState {
  success?: boolean;
  error?: string;
}

const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function requestStoreAction(
  _prev: StoreRequestState | null,
  formData: FormData,
): Promise<StoreRequestState> {
  const to = validContact(process.env.PLATFORM_CONTACT_EMAIL);
  if (!to) return { error: "Las solicitudes no están disponibles en este momento." };

  // Campo trampa: las personas no lo ven; los bots lo llenan. Se finge éxito.
  if (field(formData, "website")) return { success: true };

  const name = field(formData, "name");
  const email = field(formData, "email");
  const cafe = field(formData, "cafe");
  const city = field(formData, "city");
  const phone = field(formData, "phone");
  const message = field(formData, "message");

  if (!name || !email || !cafe) {
    return { error: "Escribe tu nombre, tu correo y el nombre de tu café." };
  }
  if (!validContact(email) || email.length > 200) {
    return { error: "Revisa tu correo: no parece válido." };
  }
  if ([name, cafe, city, phone].some((v) => v.length > 120) || message.length > 3000) {
    return { error: "Algún campo es demasiado largo." };
  }

  // Lo que armó en la landing: solo se aceptan funciones conocidas.
  const keys = new Set(formData.getAll("features").map(String));
  const state = Object.fromEntries(DEMO_FEATURES.map((f) => [f.key, keys.has(f.key)])) as DemoState;
  const on = DEMO_FEATURES.filter((f) => state[f.key]).map((f) => f.label);

  const ip = clientIpFrom(await headers()) ?? "sin-ip";
  if (!allow(ip)) {
    return { error: "Enviaste varias solicitudes seguidas. Intenta de nuevo en unos minutos." };
  }

  const body = [
    `Café o tostadora: ${cafe}`,
    `Ciudad: ${city || "sin dato"}`,
    `WhatsApp o teléfono: ${phone || "sin dato"}`,
    "",
    `Lo que armó: ${summarize(state).title}`,
    `Funciones: ${on.length ? on.join(", ") : "ninguna función extra"}`,
    ...(message ? ["", message] : []),
  ].join("\n");

  try {
    const result = await sendContactNotificationEmail({
      name,
      email,
      subject: `Solicitud de tienda: ${cafe}`,
      message: body,
      store: { name: "Bestkofi" },
      recipient: to,
    });
    if (!result.success) {
      console.error("[Solicitud de tienda] No se pudo enviar:", result.error);
      return { error: `No pudimos enviar tu solicitud. Escríbenos a ${to}.` };
    }
    return { success: true };
  } catch (err) {
    console.error("[Solicitud de tienda]", err);
    return { error: `No pudimos enviar tu solicitud. Escríbenos a ${to}.` };
  }
}
