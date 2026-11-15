"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_COOKIE, DEMO_KEYS } from "../demo";
import { getCurrentTenant } from "../data/tenant";

/**
 * Guarda el estado de la demo del visitante. Solo funciona en una tienda marcada
 * como sandbox y solo acepta booleanos de las capacidades conocidas.
 */
export async function setDemoFeaturesAction(
  state: Record<string, boolean> | null,
): Promise<{ ok: boolean }> {
  const tenant = await getCurrentTenant();
  if (!tenant.demo) return { ok: false };

  const store = await cookies();
  if (!state) {
    store.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  } else {
    const clean: Record<string, boolean> = {};
    for (const key of DEMO_KEYS) {
      if (typeof state[key] === "boolean") clean[key] = state[key];
    }
    store.set(DEMO_COOKIE, JSON.stringify(clean), {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
