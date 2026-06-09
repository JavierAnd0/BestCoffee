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

export async function getCurrentCustomer(): Promise<MockCustomer> {
  if (env.useMocks) return MOCK_CUSTOMER;
  throw new Error("getCurrentCustomer: live API not wired yet — GET /v1/customers/me");
}

export async function getCustomerAddresses(): Promise<MockAddress[]> {
  if (env.useMocks) return MOCK_ADDRESSES;
  throw new Error("getCustomerAddresses: live API not wired yet");
}

export async function getCustomerOrders(): Promise<MockOrder[]> {
  if (env.useMocks) return MOCK_ORDERS;
  throw new Error("getCustomerOrders: live API not wired yet");
}

export async function getCustomerSubscriptions(): Promise<MockSubscription[]> {
  if (env.useMocks) return MOCK_SUBSCRIPTIONS;
  throw new Error("getCustomerSubscriptions: live API not wired yet");
}
