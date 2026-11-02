import { cache } from "react";
import { notFound } from "next/navigation";
import { env } from "../env";
import { apiServer } from "../api/client";
import { mapTenant, type ApiTenant } from "../api/mappers";
import { TENANT_ORIGEN } from "../mocks/tenant";
import type { Tenant } from "../types";

// `cache()` memoiza por request: el layout, los guards de feature y las páginas
// pueden pedir el tenant sin disparar múltiples llamadas a la API.
//
// Política multi-tenant: la tienda demo (TENANT_ORIGEN) solo se usa con
// USE_MOCKS. En modo real NUNCA se muestra la marca de otra tienda: si la tienda
// no existe → 404; si la API falla → error visible (mejor que una marca ajena).
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  if (env.useMocks) return TENANT_ORIGEN;

  let status = 0;
  let payload: unknown = null;
  try {
    const api = await apiServer();
    const { data, response } = await api.GET("/v1/tenants/current");
    status = response.status;
    payload = data ?? null;
  } catch {
    throw new Error("No se pudo cargar la tienda");
  }

  if (status === 404) notFound();
  if (!payload) throw new Error("No se pudo cargar la tienda");
  return mapTenant(payload as unknown as ApiTenant);
});
