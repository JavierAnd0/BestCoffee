"use server";

import { revalidatePath } from "next/cache";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import type { MemberRole } from "../data/members";

// Acciones del equipo de la tienda. El backend exige ser dueño (TENANT_OWNER)
// y no deja a la tienda sin ningún dueño; aquí solo se valida la forma.

export type MemberActionResult =
  /** `email`: en el alta, el correo agregado (para armar el enlace de acceso). */
  | { ok: true; email?: string }
  | { ok: false; error: string };

const ROLES: MemberRole[] = ["TENANT_OWNER", "TENANT_EDITOR", "TENANT_ORDERS"];

function isRole(value: string): value is MemberRole {
  return (ROLES as string[]).includes(value);
}

/** El backend responde en términos técnicos; se traduce lo que el dueño puede ver. */
function friendlyError(error: string | undefined, fallback: string): string {
  if (!error) return fallback;
  if (/sin ningún TENANT_OWNER/i.test(error)) {
    return "La tienda debe conservar al menos un dueño.";
  }
  if (/ya es miembro/i.test(error)) return "Esa persona ya está en el equipo.";
  if (/rol insuficiente|no tienes acceso/i.test(error)) {
    return "Solo quien tiene el rol de dueño puede cambiar el equipo.";
  }
  return error;
}

export async function addMemberAction(
  _prev: MemberActionResult | null,
  formData: FormData,
): Promise<MemberActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Escribe un correo válido." };
  }
  if (!isRole(role)) return { ok: false, error: "Elige un rol." };

  if (!env.useMocks) {
    const r = await operatorFetch("/v1/admin/members", {
      method: "POST",
      body: { email, role, ...(name ? { name } : {}) },
    });
    if (!r.ok) {
      return { ok: false, error: friendlyError(r.error, "No se pudo agregar a la persona.") };
    }
  }
  revalidatePath("/admin/equipo");
  return { ok: true, email };
}

export async function updateMemberRoleAction(
  userId: string,
  role: string,
): Promise<MemberActionResult> {
  if (!isRole(role)) return { ok: false, error: "Rol no válido." };
  if (!env.useMocks) {
    const r = await operatorFetch(`/v1/admin/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { role },
    });
    if (!r.ok) {
      return { ok: false, error: friendlyError(r.error, "No se pudo cambiar el rol.") };
    }
  }
  revalidatePath("/admin/equipo");
  return { ok: true };
}

export async function removeMemberAction(userId: string): Promise<MemberActionResult> {
  if (!env.useMocks) {
    const r = await operatorFetch(`/v1/admin/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      return { ok: false, error: friendlyError(r.error, "No se pudo quitar a la persona.") };
    }
  }
  revalidatePath("/admin/equipo");
  return { ok: true };
}
