"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { operatorFetch } from "../api/gateway";
import type { AdminMutationResult } from "./admin-mutations";

const keysSchema = z.object({
  customerId: z.string().trim().regex(/^\d{1,20}$/, "El Customer ID son solo números."),
  pKey: z.string().trim().min(8, "Pega la P_KEY completa."),
  publicKey: z.string().trim().min(8, "Pega la llave pública completa."),
  privateKey: z.string().trim().min(8, "Pega la llave privada completa."),
  test: z.boolean(),
});

/** Guarda las llaves de ePayco; el backend las prueba contra ePayco antes. */
export async function saveEpaycoKeysAction(
  _prev: AdminMutationResult | null,
  form: FormData,
): Promise<AdminMutationResult> {
  const parsed = keysSchema.safeParse({
    customerId: form.get("customerId") ?? "",
    pKey: form.get("pKey") ?? "",
    publicKey: form.get("publicKey") ?? "",
    privateKey: form.get("privateKey") ?? "",
    test: form.get("test") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa las llaves." };
  }
  const res = await operatorFetch("/v1/admin/epayco/keys", {
    method: "PUT",
    body: parsed.data,
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudieron guardar las llaves de ePayco." };
  }
  revalidatePath("/admin/configuracion");
  return {
    ok: true,
    message: parsed.data.test
      ? "ePayco conectado en modo de pruebas: los pagos no cobran dinero real."
      : "ePayco conectado: tu tienda ya cobra con ePayco.",
  };
}

export async function disconnectEpaycoAction(): Promise<AdminMutationResult> {
  const res = await operatorFetch("/v1/admin/epayco/disconnect", { method: "POST" });
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo desconectar ePayco." };
  }
  revalidatePath("/admin/configuracion");
  return { ok: true, message: "ePayco desconectado." };
}
