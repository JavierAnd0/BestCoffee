import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = { title: "Impacto y sostenibilidad" };

const NUMBERS = [
  { value: "+40", label: "Familias productoras con relación directa" },
  { value: "60%", label: "Sobreprecio promedio sobre la bolsa C" },
  { value: "100%", label: "Empaque reciclable o compostable" },
  { value: "2 t", label: "Café tostado por mes en lotes pequeños" },
];

export default function ImpactoPage() {
  return (
    <>
      <section className="relative isolate h-[420px] grid place-items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#1f3324] via-[#2f5237] to-[#5b8862]" />
        <div className="relative text-center text-white px-6">
          <Eyebrow className="text-white/80">Impacto</Eyebrow>
          <h1 className="mt-4 font-display text-6xl lg:text-7xl font-semibold tracking-tight">
            Café que cuida
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-white/85">
            Nuestra cadena es lo más corta posible: del productor al tostador, del tostador a ti.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {NUMBERS.map((n) => (
          <div key={n.label} className="text-center sm:text-left">
            <div className="font-display text-5xl font-semibold tracking-tight">
              {n.value}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{n.label}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 space-y-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Relación directa, no comercio justo certificado
          </h2>
          <p className="text-base text-foreground/90 leading-relaxed">
            En vez de pagar por un sello, vamos a las fincas, catamos cada lote y
            negociamos un precio acorde con su calidad. Esto significa pagos por
            encima del precio internacional, transparencia total en la cadena y
            relaciones que duran años.
          </p>

          <h2 className="font-display text-3xl font-semibold tracking-tight pt-4">
            Empaque consciente
          </h2>
          <p className="text-base text-foreground/90 leading-relaxed">
            Nuestras bolsas son de papel kraft con barrera compostable y válvula
            unidireccional para preservar la frescura. Si lo prefieres, pide tu
            café en frasco retornable cuando visites una de nuestras tiendas.
          </p>
        </div>
      </section>
    </>
  );
}
