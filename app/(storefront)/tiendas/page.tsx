import type { Metadata } from "next";
import { MapPin, Clock, Phone } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { listStoreLocations } from "@/lib/data/static";

export const metadata: Metadata = { title: "Nuestras tiendas" };

export default async function TiendasPage() {
  const stores = await listStoreLocations();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <Eyebrow>Localizador</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Nuestras tiendas en Bogotá
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Visítanos para probar lanzamientos, recibir asesoría barista y comprar
          café fresco recién tostado.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-10">
        <div className="space-y-4">
          {stores.map((s) => (
            <article
              key={s.slug}
              className="rounded-lg border border-border bg-background p-6 space-y-3"
            >
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {s.name}
              </h2>
              <div className="space-y-2 text-sm text-foreground/90">
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 text-muted-foreground mt-0.5" />
                  <span>
                    {s.address}, {s.city}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="size-4 text-muted-foreground mt-0.5" />
                  <span>{s.hours}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="size-4 text-muted-foreground mt-0.5" />
                  <span>{s.phone}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Cómo llegar
              </Button>
            </article>
          ))}
        </div>

        <div
          aria-label="Mapa de ubicaciones"
          className="rounded-lg bg-muted h-[500px] lg:h-auto grid place-items-center text-sm text-muted-foreground sticky top-6 self-start"
        >
          Mapa (Mapbox / Google Maps)
        </div>
      </div>
    </div>
  );
}
