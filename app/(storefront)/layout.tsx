import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AnnounceBar } from "@/components/storefront/announce-bar";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { NewsletterPrompt } from "@/components/storefront/newsletter-prompt";
import { Toaster } from "@/components/ui/toast";
import { getAnnounceMessages } from "@/lib/data/content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getTenantSlug } from "@/lib/tenant";
import { env } from "@/lib/env";

// Título por tienda: cada cafetería muestra su propia marca, no la de la demo.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: {
      default: `${tenant.brand} — Café de especialidad`,
      template: `%s · ${tenant.brand}`,
    },
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const slug = (await getTenantSlug()) ?? env.defaultTenantSlug;
  const [tenant, announce] = await Promise.all([getCurrentTenant(), getAnnounceMessages()]);
  // Sesión de cliente iniciada (cookie httpOnly emitida por el backend). Con
  // sesión ya se recibe el boletín por defecto y NO se muestra la invitación.
  const isLoggedIn = Boolean((await cookies()).get("customer_token")?.value);

  return (
    <div data-tenant={slug} className="flex flex-col min-h-screen">
      <CartProvider
        tenantSlug={slug}
        freeShippingThresholdCents={tenant.freeShippingThresholdCents}
        shippingFlatCents={tenant.shippingFlatCents}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:px-3 focus:py-2 focus:text-sm"
        >
          Saltar al contenido
        </a>
        <AnnounceBar messages={announce} />
        <Header brand={tenant.brand} features={tenant.features} />
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
        <Footer
          brand={tenant.brand}
          isLoggedIn={isLoggedIn}
          welcomeOffer={tenant.newsletter.welcomeOffer}
        />
        <CartDrawer />
        <MobileNav features={tenant.features} />
        {tenant.newsletter.popupEnabled && !isLoggedIn && (
          <NewsletterPrompt
            brand={tenant.brand}
            tenantSlug={slug}
            welcomeOffer={tenant.newsletter.welcomeOffer}
          />
        )}
        <Toaster />
      </CartProvider>
    </div>
  );
}
