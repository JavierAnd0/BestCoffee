import { cookies } from "next/headers";

/**
 * Estado de la tienda demo por visitante. Vive en una cookie de 1 día y viaja al
 * backend en la cabecera `X-Demo-Features`; solo una tienda marcada como sandbox
 * la interpreta (en cualquier otra se ignora), así que no puede afectar a una
 * tienda real ni a otro visitante.
 */
export const DEMO_COOKIE = "bc_demo";

/** Capacidades que el visitante puede encender o apagar en la demo. */
export const DEMO_KEYS = [
  "catalog",
  "accessories",
  "blog",
  "checkout",
  "customerAccounts",
  "subscriptions",
  "discountCodes",
  "reviews",
] as const;
export type DemoKey = (typeof DEMO_KEYS)[number];

/** Valor de la cabecera, o null si el visitante no ha tocado nada. */
export async function demoHeaderValue(): Promise<string | null> {
  try {
    const raw = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!raw || raw.length > 600) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, boolean> = {};
    for (const key of DEMO_KEYS) {
      if (typeof parsed[key] === "boolean") clean[key] = parsed[key] as boolean;
    }
    return Object.keys(clean).length ? JSON.stringify(clean) : null;
  } catch {
    return null;
  }
}

/** Cabeceras extra para llamadas servidor a servidor (vacío fuera de la demo). */
export async function demoHeaders(): Promise<Record<string, string>> {
  const value = await demoHeaderValue();
  return value ? { "X-Demo-Features": value } : {};
}
