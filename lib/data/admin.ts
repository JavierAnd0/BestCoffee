import { env } from "../env";
import {
  ADMIN_KPIS,
  ADMIN_ALERTS,
  ADMIN_RECENT_ORDERS,
  SALES_LAST_14D,
  ADMIN_CUSTOMERS,
  ADMIN_DISCOUNTS,
  ADMIN_REVIEWS,
  ADMIN_AUDIT,
  type AdminKpi,
  type AdminAlert,
  type AdminRecentOrder,
  type AdminCustomer,
  type AdminDiscountCode,
  type AdminReview,
  type AdminAuditEntry,
} from "../mocks/admin";

export async function getDashboardKpis(): Promise<AdminKpi[]> {
  if (env.useMocks) return ADMIN_KPIS;
  throw new Error("getDashboardKpis: live API not wired yet");
}

export async function getDashboardAlerts(): Promise<AdminAlert[]> {
  if (env.useMocks) return ADMIN_ALERTS;
  throw new Error("getDashboardAlerts: live API not wired yet");
}

export async function getRecentOrders(): Promise<AdminRecentOrder[]> {
  if (env.useMocks) return ADMIN_RECENT_ORDERS;
  throw new Error("getRecentOrders: live API not wired yet");
}

export async function getSalesLast14d(): Promise<number[]> {
  if (env.useMocks) return SALES_LAST_14D;
  throw new Error("getSalesLast14d: live API not wired yet");
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  if (env.useMocks) return ADMIN_CUSTOMERS;
  throw new Error("listAdminCustomers: live API not wired yet");
}

export async function listDiscountCodes(): Promise<AdminDiscountCode[]> {
  if (env.useMocks) return ADMIN_DISCOUNTS;
  throw new Error("listDiscountCodes: live API not wired yet");
}

export async function listPendingReviews(): Promise<AdminReview[]> {
  if (env.useMocks) return ADMIN_REVIEWS;
  throw new Error("listPendingReviews: live API not wired yet");
}

export async function listAuditEntries(): Promise<AdminAuditEntry[]> {
  if (env.useMocks) return ADMIN_AUDIT;
  throw new Error("listAuditEntries: live API not wired yet");
}
