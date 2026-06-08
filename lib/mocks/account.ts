// Mock account data. Replaced by API calls in phase 3.
export type OrderStatus = "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type SubStatus = "ACTIVE" | "PAUSED" | "PAYMENT_FAILED" | "CANCELLED";

export interface MockOrder {
  id: string;
  createdAt: string; // already formatted "04 jun 2026"
  itemsCount: number;
  totalCents: number;
  status: OrderStatus;
  fromSubscription: boolean;
}

export interface MockSubscription {
  id: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPriceCents: number;
  frequencyDays: number;
  status: SubStatus;
  nextShipAt: string; // formatted "10 jun"
  daysUntilNext: number;
}

export interface MockAddress {
  id: string;
  label: string;
  line: string;
  isDefault: boolean;
}

export interface MockCustomer {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
}

export const MOCK_CUSTOMER: MockCustomer = {
  name: "María Restrepo",
  email: "maria@correo.com",
  phone: "+57 300 123 4567",
  memberSince: "2024",
};

export const MOCK_ADDRESSES: MockAddress[] = [
  { id: "a1", label: "Casa", line: "Cra 12 #34-56, Bogotá", isDefault: true },
  { id: "a2", label: "Oficina", line: "Cl 93 #11-20, Bogotá", isDefault: false },
];

export const MOCK_ORDERS: MockOrder[] = [
  { id: "ORG-10428", createdAt: "04 jun 2026", itemsCount: 3, totalCents: 54_700_00, status: "PROCESSING", fromSubscription: true },
  { id: "ORG-10390", createdAt: "27 may 2026", itemsCount: 1, totalCents: 18_700_00, status: "SHIPPED", fromSubscription: true },
  { id: "ORG-10312", createdAt: "13 may 2026", itemsCount: 2, totalCents: 42_000_00, status: "DELIVERED", fromSubscription: false },
  { id: "ORG-10288", createdAt: "29 abr 2026", itemsCount: 1, totalCents: 18_700_00, status: "DELIVERED", fromSubscription: true },
];

export const MOCK_SUBSCRIPTIONS: MockSubscription[] = [
  {
    id: "s_etiopia",
    productSlug: "etiopia-guji",
    productName: "Etiopía Guji",
    variantLabel: "340 g · Grano",
    unitPriceCents: 61_200_00,
    frequencyDays: 14,
    status: "ACTIVE",
    nextShipAt: "10 jun",
    daysUntilNext: 8,
  },
  {
    id: "s_hairbender",
    productSlug: "hairbender",
    productName: "Hairbender",
    variantLabel: "1 kg · Espresso",
    unitPriceCents: 140_250_00,
    frequencyDays: 28,
    status: "ACTIVE",
    nextShipAt: "22 jun",
    daysUntilNext: 20,
  },
  {
    id: "s_holler",
    productSlug: "holler-mountain",
    productName: "Holler Mountain",
    variantLabel: "340 g · Grano",
    unitPriceCents: 51_000_00,
    frequencyDays: 21,
    status: "PAUSED",
    nextShipAt: "—",
    daysUntilNext: -1,
  },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  PAYMENT_FAILED: "Pago fallido",
  CANCELLED: "Cancelada",
};
