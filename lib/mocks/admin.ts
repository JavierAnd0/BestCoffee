export interface AdminKpi {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive: boolean };
}

export const ADMIN_KPIS: AdminKpi[] = [
  { label: "Ventas hoy", value: "$2.847.000", hint: "12 pedidos", delta: { value: "+18%", positive: true } },
  { label: "Ventas del mes", value: "$48.320.000", hint: "324 pedidos", delta: { value: "+9%", positive: true } },
  { label: "Suscripciones activas", value: "186", hint: "+12 nuevas esta semana", delta: { value: "+7%", positive: true } },
  { label: "Stock bajo", value: "4", hint: "Productos por debajo del umbral", delta: { value: "+2", positive: false } },
];

// Daily sales for the last 14 days — used by the dashboard SVG bar chart.
export const SALES_LAST_14D = [
  1_200_000, 1_450_000, 1_800_000, 2_100_000, 1_650_000, 2_400_000, 2_900_000,
  2_200_000, 2_700_000, 1_900_000, 2_500_000, 3_100_000, 2_847_000, 2_600_000,
];

export interface AdminAlert {
  id: string;
  severity: "warning" | "info" | "danger";
  title: string;
  body: string;
}

export const ADMIN_ALERTS: AdminAlert[] = [
  {
    id: "al1",
    severity: "danger",
    title: "Pago fallido en suscripción",
    body: "Andrés P. · #SUB-203 · Reintento programado en 24 h",
  },
  {
    id: "al2",
    severity: "warning",
    title: "Stock bajo · Etiopía Guji 340 g",
    body: "Quedan 4 unidades. Suspenderá 12 suscripciones si llega a 0.",
  },
  {
    id: "al3",
    severity: "info",
    title: "Nueva reseña pendiente",
    body: "5 estrellas para Mezcla del alba. Listo para aprobar.",
  },
];

export interface AdminRecentOrder {
  id: string;
  customer: string;
  totalCents: number;
  status: "PROCESSING" | "SHIPPED" | "DELIVERED";
  createdAt: string;
}

export const ADMIN_RECENT_ORDERS: AdminRecentOrder[] = [
  { id: "ORG-10428", customer: "María Restrepo", totalCents: 54_700_00, status: "PROCESSING", createdAt: "hace 12 min" },
  { id: "ORG-10427", customer: "Andrés Pérez", totalCents: 22_000_00, status: "PROCESSING", createdAt: "hace 38 min" },
  { id: "ORG-10426", customer: "Clara Torres", totalCents: 84_400_00, status: "SHIPPED", createdAt: "hace 1 h" },
  { id: "ORG-10425", customer: "Jorge Camargo", totalCents: 18_700_00, status: "SHIPPED", createdAt: "hace 2 h" },
  { id: "ORG-10424", customer: "Lina Mejía", totalCents: 36_000_00, status: "DELIVERED", createdAt: "hace 3 h" },
];

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpentCents: number;
  activeSubsCount: number;
  joinedAt: string;
}

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  { id: "c1", name: "María Restrepo", email: "maria@correo.com", ordersCount: 14, totalSpentCents: 412_500_00, activeSubsCount: 2, joinedAt: "feb 2024" },
  { id: "c2", name: "Andrés Pérez", email: "andres@correo.com", ordersCount: 8, totalSpentCents: 198_000_00, activeSubsCount: 1, joinedAt: "may 2024" },
  { id: "c3", name: "Clara Torres", email: "clara@correo.com", ordersCount: 22, totalSpentCents: 684_000_00, activeSubsCount: 3, joinedAt: "ene 2024" },
  { id: "c4", name: "Jorge Camargo", email: "jorge@correo.com", ordersCount: 5, totalSpentCents: 92_500_00, activeSubsCount: 0, joinedAt: "ago 2024" },
  { id: "c5", name: "Lina Mejía", email: "lina@correo.com", ordersCount: 11, totalSpentCents: 234_000_00, activeSubsCount: 1, joinedAt: "mar 2024" },
];

export interface AdminDiscountCode {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: string;
  appliesTo: string;
  usesCount: number;
  usesLimit?: number;
  expiresAt?: string;
  active: boolean;
}

export const ADMIN_DISCOUNTS: AdminDiscountCode[] = [
  { id: "d1", code: "BIENVENIDA10", type: "PERCENT", value: "10%", appliesTo: "Primer pedido", usesCount: 248, expiresAt: "—", active: true },
  { id: "d2", code: "ENVIOGRATIS", type: "FREE_SHIPPING", value: "Envío", appliesTo: "Pedidos +$30k", usesCount: 412, expiresAt: "31 dic 2026", active: true },
  { id: "d3", code: "OTONO5", type: "FIXED", value: "$5.000", appliesTo: "Campaña otoño", usesCount: 87, usesLimit: 500, expiresAt: "30 sep 2026", active: true },
  { id: "d4", code: "VERANO2025", type: "PERCENT", value: "15%", appliesTo: "Cold brew", usesCount: 122, expiresAt: "31 ago 2025", active: false },
];

export interface AdminReview {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  verifiedSubscriber: boolean;
}

export const ADMIN_REVIEWS: AdminReview[] = [
  { id: "r1", customerName: "Sofía Pérez", productName: "Etiopía Guji", rating: 5, body: "Excelente origen. Notas frutales muy claras, perfecto en V60.", status: "PENDING", createdAt: "hace 2 h", verifiedSubscriber: true },
  { id: "r2", customerName: "Daniel Ruiz", productName: "Hairbender", rating: 4, body: "Muy buena para espresso. Un poco más oscuro de lo que esperaba pero rico.", status: "PENDING", createdAt: "ayer", verifiedSubscriber: false },
  { id: "r3", customerName: "Catalina G.", productName: "Mezcla del alba", rating: 5, body: "Mi favorita para empezar el día. Llegó fresca.", status: "APPROVED", createdAt: "hace 3 días", verifiedSubscriber: true },
  { id: "r4", customerName: "Anónimo", productName: "Decaf Trapper", rating: 2, body: "No es lo que esperaba.", status: "REJECTED", createdAt: "hace 5 días", verifiedSubscriber: false },
];

export interface AdminAuditEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
}

export const ADMIN_AUDIT: AdminAuditEntry[] = [
  { id: "au1", user: "María R.", action: "Actualizó precio", entity: "ProductVariant", entityId: "v_alba_340_grain", at: "hace 14 min" },
  { id: "au2", user: "Carlos N.", action: "Creó producto", entity: "Product", entityId: "p_la_esperanza", at: "hace 2 h" },
  { id: "au3", user: "María R.", action: "Aprobó reseña", entity: "Review", entityId: "r3", at: "hace 4 h" },
  { id: "au4", user: "María R.", action: "Cambió hero campaña", entity: "SiteContent", entityId: "hero-home", at: "ayer 18:42" },
  { id: "au5", user: "Sistema", action: "Pago fallido reintentado", entity: "Subscription", entityId: "s_sub_203", at: "ayer 09:12" },
];
