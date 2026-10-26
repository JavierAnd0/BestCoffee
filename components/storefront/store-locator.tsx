"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sparkles,
  Coffee,
  Store,
  ChevronRight,
} from "lucide-react";
import type { StoreLocation } from "@/lib/mocks/static";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface StoreLocatorProps {
  stores: StoreLocation[];
}

const FILTER_TAGS = [
  "Todas",
  "Barra de filtrados",
  "Pet friendly",
  "Terraza",
  "Molienda personalizada",
  "Casona colonial",
] as const;

export function StoreLocator({ stores }: StoreLocatorProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    stores[0]?.slug ?? "chapinero"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("Todas");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filtrado de tiendas por texto y etiquetas
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.features?.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      activeFilter === "Todas" ||
      store.features?.some(
        (f) => f.toLowerCase() === activeFilter.toLowerCase()
      );

    return matchesSearch && matchesFilter;
  });

  const selectedStore =
    stores.find((s) => s.slug === selectedSlug) ||
    filteredStores[0] ||
    stores[0];

  function handleCopyAddress(store: StoreLocation) {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(`${store.address}, Bogotá, Colombia`);
    setCopiedSlug(store.slug);
    toast({
      title: "Dirección copiada",
      description: `${store.address} copiada al portapapeles.`,
    });
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  }

  // URL para el mapa embebido de Google Maps
  const embedMapUrl = selectedStore?.coordinates
    ? `https://maps.google.com/maps?q=${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}&hl=es&z=16&output=embed`
    : `https://maps.google.com/maps?q=Bogota+Colombia+Cra+13+57-32&hl=es&z=13&output=embed`;

  return (
    <div className="space-y-12">
      {/* Barra de filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-muted/40 p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por barrio, dirección o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        {/* Chips de filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveFilter(tag)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border",
                activeFilter === tag
                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid principal: Lista de tiendas + Mapa interactivo */}
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        {/* Columna Izquierda: Lista de Tiendas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Mostrando {filteredStores.length} de {stores.length} tiendas
            </span>
            {selectedStore && (
              <span className="hidden sm:inline">
                Tienda seleccionada:{" "}
                <strong className="text-foreground">{selectedStore.name}</strong>
              </span>
            )}
          </div>

          {filteredStores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/20">
              <Store className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium">
                No encontramos tiendas con esos criterios
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Prueba borrando tu búsqueda o seleccionando &ldquo;Todas&rdquo; en los filtros.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("Todas");
                }}
              >
                Restablecer filtros
              </Button>
            </div>
          ) : (
            filteredStores.map((store) => {
              const isSelected = selectedStore?.slug === store.slug;
              return (
                <article
                  key={store.slug}
                  onClick={() => setSelectedSlug(store.slug)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-6 space-y-4 transition-all text-left bg-background shadow-xs",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.015]"
                      : "border-border hover:border-foreground/30 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs font-normal">
                          {store.neighborhood || "Bogotá"}
                        </Badge>
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                          </span>
                          Abierto hoy
                        </span>
                      </div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        {store.name}
                      </h2>
                    </div>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSlug(store.slug);
                      }}
                      className="shrink-0"
                    >
                      {isSelected ? "En el mapa" : "Ver en mapa"}
                    </Button>
                  </div>

                  {store.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {store.description}
                    </p>
                  )}

                  {/* Datos clave de la tienda */}
                  <div className="space-y-2 text-sm text-foreground/85 pt-1 border-t border-border/60">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="flex-1 font-medium">
                        {store.address}, {store.city}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">
                        {store.hours}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <a
                        href={`tel:${store.phone.replace(/[^0-9+]/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                      >
                        {store.phone}
                      </a>
                    </div>
                  </div>

                  {/* Amenities / Características */}
                  {store.features && store.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {store.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <a
                          href={
                            store.googleMapsUrl ||
                            `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lng}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      className="gap-1.5 text-xs"
                    >
                      <Navigation className="size-3.5" />
                      Cómo llegar
                      <ExternalLink className="size-3 opacity-60" />
                    </Button>

                    {store.wazeUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={
                          <a
                            href={store.wazeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                        className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Waze
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(store);
                      }}
                      className="gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto"
                    >
                      {copiedSlug === store.slug ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-600">Copiada</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Columna Derecha: Mapa Interactivo con Google Maps */}
        <div className="sticky top-20 self-start space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            {/* Header superior del mapa */}
            <div className="p-4 bg-muted/60 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="text-xs font-medium text-foreground truncate">
                  {selectedStore?.name || "Mapa de tiendas"}
                </span>
                {selectedStore?.neighborhood && (
                  <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                    {selectedStore.neighborhood}
                  </Badge>
                )}
              </div>

              {selectedStore && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={
                      selectedStore.googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium px-2 py-1 rounded-md hover:bg-background/80 transition-colors"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Contenedor del Iframe de Mapa */}
            <div className="relative w-full h-[460px] lg:h-[540px] bg-muted/30">
              <iframe
                title={`Mapa de ${selectedStore?.name || "Nuestras tiendas en Bogotá"}`}
                src={embedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale-[0.1] contrast-[1.02]"
              />

              {/* Botón flotante inferior con resumen y acción directa */}
              {selectedStore && (
                <div className="absolute bottom-4 inset-x-4 bg-background/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {selectedStore.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedStore.address} · {selectedStore.hours}
                    </p>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    render={
                      <a
                        href={
                          selectedStore.googleMapsUrl ||
                          `https://www.google.com/maps/dir/?api=1&destination=${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    className="gap-1.5 text-xs shrink-0 shadow-sm"
                  >
                    <Navigation className="size-3.5" />
                    Ruta
                  </Button>
                </div>
              )}
            </div>

            {/* Selector rápido de tiendas en la base del mapa */}
            <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap pl-1 font-medium">
                Cambiar tienda:
              </span>
              <div className="flex items-center gap-1.5">
                {stores.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setSelectedSlug(s.slug)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap font-medium",
                      selectedStore?.slug === s.slug
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {s.neighborhood || s.name.replace("ORÍGEN ", "")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Experiencia en tienda */}
      <section className="pt-8 border-t border-border space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Eyebrow>Visítanos</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            ¿Qué vivirás en nuestras tiendas?
          </h2>
          <p className="text-sm text-muted-foreground">
            Diseñamos cada espacio para que sientas la cultura cafetera desde el primer aroma hasta el último sorbo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Coffee className="size-5" />
            </div>
            <h3 className="font-semibold text-base">Barra de filtrados</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Disfruta tus microlotes favoritos preparados en V60, Chemex, Aeropress u Origami con ratios calibrados a diario.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-semibold text-base">Molienda a tu medida</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Elige cualquier café en grano y te lo molemos en el acto según tu cafetera en nuestros molinos profesionales Mahlkönig.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Store className="size-5" />
            </div>
            <h3 className="font-semibold text-base">Catas y talleres</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Los sábados abrimos sesiones guiadas para explorar orígenes de Huila, Nariño, Tolima y Cauca con baristas Q-Grader.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Navigation className="size-5" />
            </div>
            <h3 className="font-semibold text-base">Frasco retornable</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trae tu envase o frasco reutilizable a cualquiera de nuestras sedes y recibe un descuento de $2.000 COP en tu recarga.
            </p>
          </div>
        </div>
      </section>

      {/* Sección 3: Banner de Despacho Nacional */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-muted/60 via-background to-muted/40 p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            Despacho a toda Colombia
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            ¿No estás en Bogotá? Llevamos el café a tu puerta
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tostamos semanalmente microlotes de pequeños productores y los enviamos empacados en válvula desgasificadora a cualquier municipio de Colombia. Envíos gratis desde $90.000 COP.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            render={<Link href="/catalogo" />}
            className="gap-2"
          >
            Explorar catálogo online
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/quiz" />}
          >
            Encuentra tu café ideal
          </Button>
        </div>
      </section>
    </div>
  );
}
