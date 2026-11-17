import { requireEditorialPage } from "@/lib/data/feature-guard";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listStoreLocations } from "@/lib/data/static";
import { StoreLocator } from "@/components/storefront/store-locator";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/seo";
import { getCurrentTenant } from "@/lib/data/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return {
    title: "Nuestras tiendas",
    description: `Sedes de ${tenant.brand}: dirección, horario y cómo llegar.`,
  };
}

export default async function TiendasPage() {
  await requireEditorialPage("tiendas");
  const [stores, tenant, siteUrl] = await Promise.all([
    listStoreLocations(),
    getCurrentTenant(),
    getSiteUrl(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <JsonLd
        data={[
          // Una ficha por sede: dirección, teléfono y coordenadas para búsquedas locales.
          // Solo los datos que la sede tiene cargados (sin 0,0 ni teléfono vacío).
          ...stores.map((store) => ({
            "@context": "https://schema.org",
            "@type": "CafeOrCoffeeShop",
            name: `${tenant.brand} · ${store.name}`,
            ...(store.description && { description: store.description }),
            url: `${siteUrl}/tiendas`,
            ...(store.phone.trim() && { telephone: store.phone }),
            parentOrganization: { "@id": `${siteUrl}/#organization` },
            address: {
              "@type": "PostalAddress",
              streetAddress: store.address,
              addressLocality: store.city,
              addressCountry: "CO",
            },
            ...((store.coordinates.lat !== 0 || store.coordinates.lng !== 0) && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: store.coordinates.lat,
                longitude: store.coordinates.lng,
              },
            }),
            ...(store.googleMapsUrl && { hasMap: store.googleMapsUrl }),
          })),
        ]}
      />
      {/* Cabecera idéntica a la guía de diseño */}
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <Eyebrow>Localizador</Eyebrow>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Nuestras tiendas
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Visita {tenant.brand} en persona.
        </p>
      </header>

      {stores.length > 0 ? (
        <StoreLocator stores={stores} showOnlineShop={tenant.features.catalog} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Aún no hay sedes publicadas.
        </p>
      )}
    </div>
  );
}
