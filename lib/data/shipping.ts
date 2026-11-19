import { env } from "../env";
import { operatorFetch } from "../api/gateway";

export interface EnviaOrigin {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  street: string;
  reference?: string;
  city: string;
  state: string;
  cityCode: string;
  stateCode: string;
  identificationNumber?: string;
}

export interface EnviaStatus {
  connected: boolean;
  test: boolean;
  origin: EnviaOrigin | null;
  package: { lengthCm: number; widthCm: number; heightCm: number; packagingGrams: number };
  /** Envia avisa los cambios por webhook (si no, quedan las consultas cada 30 min). */
  webhookRegistered: boolean;
  hasWebhookSecret: boolean;
}

/** Estado de la cuenta de Envia de la tienda (el token nunca vuelve al front). */
export async function getEnviaStatus(): Promise<EnviaStatus | null> {
  if (env.useMocks) return null;
  const res = await operatorFetch<EnviaStatus>("/v1/admin/shipping/envia");
  return res.ok ? res.data : null;
}
