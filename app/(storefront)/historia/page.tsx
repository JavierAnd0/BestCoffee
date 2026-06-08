import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = { title: "Nuestra historia" };

export default function HistoriaPage() {
  return (
    <>
      <section className="relative isolate h-[420px] grid place-items-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#2a1810] via-[#4a2b1c] to-[#7d3d2a]"
        />
        <div className="relative text-center text-white px-6">
          <Eyebrow className="text-white/80">Desde 2018</Eyebrow>
          <h1 className="mt-4 font-display text-6xl lg:text-7xl font-semibold tracking-tight">
            Nuestra historia
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 space-y-7">
        <p className="font-display text-xl leading-relaxed">
          ORÍGEN nació en una bodega pequeña de Chapinero con un solo tostador de
          5 kilos y la idea fija de que el café colombiano de alta calidad debía
          quedarse en Colombia.
        </p>
        <p className="text-base text-foreground/90 leading-relaxed">
          Empezamos comprándole a tres familias en Huila y Nariño. Hoy trabajamos
          con más de 40 fincas y mantenemos relación directa con cada productora y
          productor. Pagamos en promedio 60% por encima del precio C de bolsa
          según el lote y el resultado de la cata.
        </p>
        <p className="text-base text-foreground/90 leading-relaxed">
          Creemos en tostar pequeño y enviar fresco. Cada bolsa que sale de
          nuestra tostadora salió del tostador hace menos de cinco días. La fecha
          de tueste está impresa en cada empaque.
        </p>

        <h2 className="font-display text-3xl font-semibold tracking-tight pt-8">
          Lo que defendemos
        </h2>
        <ul className="space-y-4 text-base text-foreground/90 leading-relaxed">
          <li>
            <strong className="font-display">Calidad sobre escala.</strong> Lotes
            pequeños, cata previa al tueste y QC en cada despacho.
          </li>
          <li>
            <strong className="font-display">Relación directa.</strong> Conocemos
            a quien cultiva nuestro café. Sin intermediarios.
          </li>
          <li>
            <strong className="font-display">Precios justos.</strong> Tanto al
            productor como al consumidor. Sin marcas de lujo artificiales.
          </li>
          <li>
            <strong className="font-display">Frescura.</strong> Tostado bajo
            pedido. Enviado en máximo 48 horas desde el tueste.
          </li>
        </ul>
      </div>
    </>
  );
}
