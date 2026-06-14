import { env } from "../env";
import { apiServer } from "../api/client";
import { mapTenant, type ApiTenant } from "../api/mappers";
import { TENANT_ORIGEN } from "../mocks/tenant";
import type { Tenant } from "../types";

export async function getCurrentTenant(): Promise<Tenant> {
  if (env.useMocks) return TENANT_ORIGEN;
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/tenants/current");
  if (error || !data) {
    // Storefront must render even if the tenant call hiccups; fall back to
    // the seed tenant rather than crashing the whole layout.
    return TENANT_ORIGEN;
  }
  return mapTenant(data as unknown as ApiTenant);
}
