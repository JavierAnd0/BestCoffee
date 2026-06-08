import { AnnounceBar } from "@/components/storefront/announce-bar";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { Toaster } from "@/components/ui/toast";
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:px-3 focus:py-2 focus:text-sm"
        >
          Saltar al contenido
        </a>
        <AnnounceBar messages={ANNOUNCE_MESSAGES} />
        <Header brand={tenant.brand} />
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
        <Footer brand={tenant.brand} />
        <CartDrawer />
        <MobileNav />
        <Toaster />
      </CartProvider>
    </div>
  );
}
