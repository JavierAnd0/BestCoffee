import type { Tenant } from "../types";

export const TENANT_ORIGEN: Tenant = {
  slug: "origen",
  name: "ORÍGEN",
  brand: "ORÍGEN",
  tagline: "Tostadores de café de especialidad",
  tier: "PRO",
  features: {
    blog: true,
    catalog: true,
    checkout: true,
    customerAccounts: true,
    subscriptions: true,
    discountCodes: true,
    reviews: true,
    gifts: false,
    customDomain: false,
    maxProducts: 50,
  },
  freeShippingThresholdCents: 45_000_00, // $45.000 COP
  subscriptionDiscountPct: 15,
  currency: "COP",
};
