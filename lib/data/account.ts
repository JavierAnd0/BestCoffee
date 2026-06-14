import { env } from "../env";
import {
  MOCK_CUSTOMER,
  MOCK_ADDRESSES,
  MOCK_ORDERS,
  MOCK_SUBSCRIPTIONS,
  type MockCustomer,
  type MockAddress,
  type MockOrder,
  type MockSubscription,
} from "../mocks/account";

// ── API shape for GET /v1/customers/me ───────────────────────────────────────

interface ApiCustomer {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  createdAt?: string | null;
}

function mapCustomer(c: ApiCustomer): MockCustomer {
  const fullName =
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    c.name?.trim() ||
    c.email;
  return {
    name: fullName,
    email: c.email,
    phone: c.phone ?? "",
    memberSince: c.createdAt
      ? new Date(c.createdAt).getFullYear().toString()
      : "—",
  };
}

async function fetchMe(): Promise<MockCustomer | null> {
  const { cookies, headers } = await import("next/headers");
  const c = await cookies();
  const h = await headers();

  const token =
    c.get("bestcoffee-session")?.value ?? c.get("customer_token")?.value;
  if (!token) return null;

  const res = await fetch(`${env.apiUrlInternal}/v1/customers/me`, {
    headers: {
      "X-Tenant-Slug": h.get("x-tenant-slug") ?? "origen",
      Authorization: `Bearer ${token}`,
      Cookie: `customer_token=${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return mapCustomer((await res.json()) as ApiCustomer);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCurrentCustomer(): Promise<MockCustomer> {
  if (env.useMocks) return MOCK_CUSTOMER;
  try {
    return (await fetchMe()) ?? MOCK_CUSTOMER;
  } catch {
    return MOCK_CUSTOMER;
  }
}

// Orders, subscriptions and addresses have no backend endpoint yet → mock.

export async function getCustomerAddresses(): Promise<MockAddress[]> {
  return MOCK_ADDRESSES;
}

export async function getCustomerOrders(): Promise<MockOrder[]> {
  return MOCK_ORDERS;
}

export async function getCustomerSubscriptions(): Promise<MockSubscription[]> {
  return MOCK_SUBSCRIPTIONS;
}
