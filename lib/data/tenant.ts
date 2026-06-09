import { env } from "../env";
import { TENANT_ORIGEN } from "../mocks/tenant";
import type { Tenant } from "../types";

export async function getCurrentTenant(): Promise<Tenant> {
  if (env.useMocks) return TENANT_ORIGEN;
  throw new Error("getCurrentTenant: live API not wired yet — GET /v1/tenants/current");
}
