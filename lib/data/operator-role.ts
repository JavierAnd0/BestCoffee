import { cache } from "react";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";

export type OperatorTenantRole =
  | "PLATFORM_OWNER"
  | "TENANT_OWNER"
  | "TENANT_EDITOR"
  | "TENANT_ORDERS";

export type OperatorRoleResult =
  /** `role` null: la sesión es válida pero no es miembro de esta tienda. */
  | { ok: true; role: OperatorTenantRole | null }
  | { ok: false };

/**
 * Rol del operador en la tienda actual. `/v1/auth/me` lo devuelve como
 * `tenantRole` cuando recibe `X-Tenant-Slug` (lo pone operatorFetch).
 * Memorizado por petición: el layout y la página lo comparten.
 */
export const getOperatorTenantRole = cache(async (): Promise<OperatorRoleResult> => {
  if (env.useMocks) return { ok: true, role: "TENANT_OWNER" };
  const r = await operatorFetch<{ tenantRole?: OperatorTenantRole | null }>("/v1/auth/me");
  if (!r.ok) return { ok: false };
  return { ok: true, role: r.data?.tenantRole ?? null };
});

/** Dueño de la tienda (o de la plataforma, que tiene todos los permisos). */
export function isOwnerRole(role: OperatorTenantRole | null): boolean {
  return role === "TENANT_OWNER" || role === "PLATFORM_OWNER";
}

export const ROLE_LABELS: Record<OperatorTenantRole, string> = {
  PLATFORM_OWNER: "Plataforma",
  TENANT_OWNER: "Dueño",
  TENANT_EDITOR: "Editor",
  TENANT_ORDERS: "Pedidos",
};
