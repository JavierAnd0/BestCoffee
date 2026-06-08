import type { Metadata } from "next";
import { CheckoutWizard } from "@/components/storefront/checkout-wizard";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <CheckoutWizard />;
}
