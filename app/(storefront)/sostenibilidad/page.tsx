import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Leaf, Sprout, HeartHandshake, Recycle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sostenibilidad & Origen",
  description:
    "Nuestro compromiso con el medio ambiente, la caficultura regenerativa y el pago justo a los productores de café en Colombia.",
};

const PILLARS = [
  {
    icon: <HeartHandshake className="size-6 text-emerald-600 dark:text-emerald-400" />,
    title: "Comercio Directo y Transparente",
    body: "Pagamos en promedio un 60% por encima del precio internacional C de bolsa. Compramos de manera directa sin intermediarios comerciales que diluyan el valor para el caficultor.",
  },
  {
    icon: <Sprout className="size-6 text-emerald-600 dark:text-emerald-400" />,
    title: "Caficultura Regenerativa",
    body: "Apoyamos fincas que aplican sombra natural, rotación de cultivos y protección de cuencas hídricas locales, promoviendo la biodiversidad en las regiones de origen.",
  },
  {
    icon: <Recycle className="size-6 text-emerald-600 dark:text-emerald-400" />,
    title: "Empaque Consciente",
    body: "Nuestras bolsas están fabricadas con papel kraft certificado y barreras biodegradables. Además fomentamos el uso de recipientes retornables en nuestras tiendas físicas.",
  },
  {
    icon: <Leaf className="size-6 text-emerald-600 dark:text-emerald-400" />,
    title: "Tostado Eficiente en Lotes Pequeños",
    body: "Nuestra curva de tueste optimizada minimiza la emisión de calor y desperdicio de energía, tostando bajo demanda semanal para evitar mermas de producto.",
  },
];

const METRICS = [
  { value: "+40", label: "Familias caficultoras asociadas" },
  { value: "60%", label: "Sobreprecio promedio sobre bolsa C" },
  { value: "100%", label: "Empaques reciclables o compostables" },
  { value: "0", label: "Intermediarios en la compra de café verde" },
];

export default function SostenibilidadPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <section className="mb-16 text-center max-w-3xl mx-auto">
        <Eyebrow>Planeta & Comunidad</Eyebrow>
        <h1 className="mt-3 font-display text-5xl lg:text-6xl font-semibold tracking-tight">
          Sostenibilidad desde la raíz
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Para nosotros, la sostenibilidad no es una etiqueta publicitaria: es el modelo económico y ético que permite que el mejor café colombiano siga existiendo para las próximas generaciones.
        </p>
      </section>

      {/* Imagen destacada de origen */}
      <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden mb-16 shadow-lg border border-border">
        <Image
          src="/img/bulto-colombia.jpg"
          alt="Saco de café Product of Colombia"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6 sm:p-10">
          <p className="text-white font-display text-xl sm:text-2xl font-light drop-shadow-md">
            100% Café de origen colombiano con trazabilidad directa desde la finca
          </p>
        </div>
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-y border-border mb-16">
        {METRICS.map((m) => (
          <div key={m.label} className="text-center">
            <div className="font-display text-4xl lg:text-5xl font-semibold text-primary">
              {m.value}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </section>

      {/* Pilares */}
      <section className="mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Nuestros Pilares</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Acciones reales en cada eslabón
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-card p-8 text-card-foreground space-y-4 hover:border-border/80 transition-colors"
            >
              <div className="size-12 rounded-xl bg-emerald-500/10 grid place-items-center">
                {p.icon}
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Visita nuestro impacto */}
      <section className="rounded-2xl border border-border bg-muted/40 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <h3 className="font-display text-3xl font-semibold tracking-tight">
            Conoce el impacto de tu compra
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Cada bolsa de café tiene un código de trazabilidad donde puedes consultar el nombre del productor, la vereda, la altitud y el proceso de fermentación de cada lote.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/impacto">
            <Button variant="outline" className="gap-2">
              Ver reporte de impacto
            </Button>
          </Link>
          <Link href="/catalogo">
            <Button className="gap-2">
              Explorar cafés sostenibles <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

