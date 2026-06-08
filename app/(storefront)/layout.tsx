import { AnnounceBar } from "@/components/storefront/announce-bar";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ANNOUNCE_MESSAGES } from "@/lib/mocks/site-content";
import { TENANT_ORIGEN } from "@/lib/mocks/tenant";
import { getTenantSlug } from "@/lib/tenant";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const slug = (await getTenantSlug()) ?? "origen";
  const tenant = TENANT_ORIGEN;

  return (
    <div data-tenant={slug} className="flex flex-col min-h-screen">
      <CartProvider>
        <AnnounceBar messages={ANNOUNCE_MESSAGES} />
        <Header brand={tenant.brand} />
        <main className="flex-1">{children}</main>
        <Footer brand={tenant.brand} />
        <CartDrawer />
      </CartProvider>
    </div>
  );
}
