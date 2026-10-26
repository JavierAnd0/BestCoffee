import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listStoreLocations } from "@/lib/data/static";
import { StoreLocator } from "@/components/storefront/store-locator";

export const metadata: Metadata = {
  title: "Nuestras tiendas en Bogotá · ORÍGEN Café",
  description:
    "Visítanos en nuestras sedes de Chapinero, Usaquén y La Candelaria para probar lanzamientos, recibir asesoría barista y comprar café fresco recién tostado.",
};

const FAQS = [
  {
    q: "¿Qué métodos de pago reciben en las tiendas físicas?",
    a: "Recibimos todas las tarjetas de crédito y débito, transferencias vía PSE/Nequi/Daviplata, MercadoPago y efectivo.",
  },
  {
    q: "¿Puedo comprar café en grano y pedir que lo muelan en la tienda?",
    a: "Por supuesto. Nuestros baristas calibran el molino Mahlkönig al tamaño exacto de tu cafetera (espresso, moka, filtro V60, prensa francesa o cold brew) sin costo adicional.",
  },
  {
    q: "¿Tienen opciones de repostería y leches vegetales?",
    a: "Sí, contamos con repostería artesanal horneada cada mañana, opciones sin gluten y alternativas de leche de avena y almendras sin recargo excesivo.",
  },
  {
    q: "¿Puedo trabajar con mi computador en las tiendas?",
    a: "¡Totalmente bienvenidos! Nuestras tiendas cuentan con WiFi simétrico de alta velocidad, tomas eléctricas en la mayoría de mesas y ambiente acogedor.",
  },
  {
    q: "¿Cómo funciona el beneficio de envase retornable?",
    a: "Si traes tu propio frasco de vidrio o bolsa hermética de una compra anterior, te descontamos $2.000 COP en cada recarga de café de 250g o 500g como parte de nuestro compromiso de cero residuos.",
  },
];

export default async function TiendasPage() {
  const stores = await listStoreLocations();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Cabecera idéntica a la guía de diseño */}
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <Eyebrow>Localizador</Eyebrow>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Nuestras tiendas en Bogotá
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Visítanos para probar lanzamientos, recibir asesoría barista y comprar
          café fresco recién tostado.
        </p>
      </header>

      {/* Componente interactivo de Tiendas y Mapa */}
      <StoreLocator stores={stores} />

      {/* Preguntas frecuentes sobre visitas */}
      <section className="pt-8 border-t border-border space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Eyebrow>Dudas Frecuentes</Eyebrow>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Preguntas frecuentes sobre nuestras tiendas
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-border bg-card/60 space-y-2 text-left"
            >
              <h3 className="font-medium text-sm text-foreground">
                {faq.q}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
