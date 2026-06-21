import { redirect } from "next/navigation";
import { getCurrentTenant } from "./tenant";
import type { TenantFeatures } from "../types";

type BooleanFeature = {
  [K in keyof TenantFeatures]: TenantFeatures[K] extends boolean ? K : never;
}[keyof TenantFeatures];

// A dónde mandar al visitante cuando su tienda (tier) no incluye la sección.
// El catálogo siempre existe, así que es el destino neutro por defecto.
const FALLBACK: Record<BooleanFeature, string> = {
  blog: "/",
  catalog: "/",
  checkout: "/catalogo",
  subscriptions: "/catalogo",
  customerAccounts: "/",
  discountCodes: "/catalogo",
  reviews: "/",
  gifts: "/",
  customDomain: "/",
};

/**
 * Guard de página/servidor: corta el render de una ruta si el tier de la tienda
 * no incluye la capacidad. Llamar al inicio de un Server Component:
 *
 *   export default async function CheckoutPage() {
 *     await requireFeature("checkout");
 *     ...
 *   }
 *
 * Defensa en profundidad: el backend ya bloquea las mutaciones con 402, pero
 * esto evita que el visitante aterrice en una página vacía o rota.
 */
export async function requireFeature(
  feature: BooleanFeature,
  fallback?: string,
): Promise<void> {
  const tenant = await getCurrentTenant();
  if (!tenant.features[feature]) {
    redirect(fallback ?? FALLBACK[feature]);
  }
}
