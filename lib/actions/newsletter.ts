"use server";

import { z } from "zod";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";
import { TENANT_ORIGEN } from "../mocks/tenant";
import type { TenantNewsletter } from "../types";

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Ingresa tu correo electrónico.")
    .email("Ingresa un correo electrónico válido."),
  source: z.enum(["popup", "footer"]).default("popup"),
});

export type SubscribeNewsletterResult =
  | { ok: true; message: string; welcomeOffer: TenantNewsletter["welcomeOffer"] }
  | { ok: false; error: string };

/**
 * Suscribe a un visitante SIN sesión al boletín de la tienda actual.
 * (Quien tiene cuenta ya está suscrito por defecto y gestiona la preferencia
 * desde "Mis datos".)
 */
export async function subscribeNewsletterAction(input: {
  email: string;
  source?: "popup" | "footer";
}): Promise<SubscribeNewsletterResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Correo electrónico inválido.",
    };
  }

  if (env.useMocks) {
    return {
      ok: true,
      message: "¡Listo! Ya haces parte de nuestra comunidad.",
      welcomeOffer: TENANT_ORIGEN.newsletter.welcomeOffer,
    };
  }

  const tenantSlug = await resolveActiveTenantSlug();

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "No pudimos conectar con el servidor. Intenta de nuevo en un momento.",
    };
  }

  if (res.status === 429) {
    return {
      ok: false,
      error: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: "No pudimos registrar tu suscripción. Intenta de nuevo más tarde.",
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    welcomeOffer?: { code?: string; label?: string } | null;
  };

  return {
    ok: true,
    message: data.message ?? "¡Listo! Ya haces parte de nuestra comunidad.",
    welcomeOffer:
      data.welcomeOffer?.code && data.welcomeOffer.label
        ? { code: data.welcomeOffer.code, label: data.welcomeOffer.label }
        : null,
  };
}
