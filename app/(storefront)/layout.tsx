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
import { JsonLd } from "@/components/seo/json-ld";
import { BrandProvider } from "@/components/storefront/brand-context";
import { DemoPanel } from "@/components/storefront/demo-panel";
import { getSiteUrl, organizationLd, tenantDescription, websiteLd } from "@/lib/seo";

// Título por tienda: cada cafetería muestra su propia marca, no la de la demo.
export async function generateMetadata(): Promise<Metadata> {
  const [tenant, siteUrl] = await Promise.all([getCurrentTenant(), getSiteUrl()]);
  const description = tenantDescription(tenant);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${tenant.brand} — Café de especialidad`,
      template: `%s · ${tenant.brand}`,
    },
    description,
    applicationName: tenant.brand,
    // "./" = cada página se declara canónica a sí misma, sin parámetros de búsqueda.
    alternates: { canonical: "./" },
    openGraph: {
      type: "website",
      siteName: tenant.brand,
      locale: "es_CO",
      url: "./",
      // Sin title/description: cada página aporta los suyos.
    },
    twitter: { card: "summary_large_image" },
    // Suspendida por cobro: se sirve "tienda no disponible" y no debe indexarse.
    robots: tenant.suspended ? { index: false, follow: false } : { index: true, follow: true },
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
  const siteUrl = await getSiteUrl();

  // Tienda suspendida por cobro: no se muestra el sitio ni se vende. El panel
  // de operador sigue accesible para que el dueño pueda regularizar.
  if (tenant.suspended) {
    return (
      <main className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="eyebrow text-muted-foreground">{tenant.brand}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Tienda no disponible
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta tienda está temporalmente fuera de servicio. Si eres el propietario, ingresa al
            panel para revisar el estado de tu plan.
          </p>
          <a href="/acceso" className="inline-block text-sm underline underline-offset-4">
            Acceso de operadores
          </a>
        </div>
      </main>
    );
  }

  return (
    <div
      data-tenant={slug}
      className="flex flex-col min-h-screen"
      // Color de acento de la tienda (validado como hex en el mapper).
      style={
        tenant.branding.accent
          ? ({ "--accent": tenant.branding.accent } as React.CSSProperties)
          : undefined
      }
    >
      <JsonLd data={[organizationLd(tenant, siteUrl), websiteLd(tenant, siteUrl)]} />
      <BrandProvider brand={tenant.brand} logoUrl={tenant.branding.logoUrl}>
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
        <Header brand={tenant.brand} features={tenant.features} branding={tenant.branding} />
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
        <Footer
          brand={tenant.brand}
          isLoggedIn={isLoggedIn}
          welcomeOffer={tenant.newsletter.welcomeOffer}
          features={tenant.features}
          pages={tenant.branding.pages}
        />
        <CartDrawer />
        <MobileNav features={tenant.features} />
        {/* En la demo no se muestra: compite con el panel de interruptores. */}
        {tenant.newsletter.popupEnabled && !isLoggedIn && !tenant.demo && (
          <NewsletterPrompt
            brand={tenant.brand}
            tenantSlug={slug}
            welcomeOffer={tenant.newsletter.welcomeOffer}
          />
        )}
        <Toaster />
        {tenant.demo && <DemoPanel features={tenant.features} />}
      </CartProvider>
      </BrandProvider>
    </div>
  );
}
