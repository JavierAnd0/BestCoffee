import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { listProducts } from "@/lib/data/products";

export const metadata: Metadata = { title: "Suscripciones" };

const STEPS = [
  {
    n: "1",
    title: "Elige tu café",
    body: "Una mezcla, un origen único o cambia cada mes.",
  },
  {
    n: "2",
    title: "Define tu ritmo",
    body: "Cada 1, 2, 3, 4, 6 u 8 semanas. Cámbialo cuando quieras.",
  },
  {
    n: "3",
    title: "Recibe café fresco",
    body: "Tostado bajo pedido y enviado en máximo 48 horas.",
  },
];

const PERKS = [
  "Ahorra 15% en cada entrega",
  "Pausa o salta envíos cuando quieras",
  "Acceso a lanzamientos limitados antes que nadie",
  "Cancela en un click",
];

export default async function SuscripcionesPage() {
  const products = await listProducts();
  const subProducts = products.filter((p) => p.subscriptionAvailability !== "NO").slice(0, 4);

  return (
    <>
      <section className="relative isolate min-h-[420px] grid place-items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#3b2418] via-[#5a3826] to-[#a25234]" />
        <div className="relative text-center text-white px-6 py-20">
          <Eyebrow className="text-white/80">Suscripciones</Eyebrow>
          <h1 className="mt-4 font-display text-6xl lg:text-7xl font-semibold tracking-tight">
            Tu café, automático
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-white/85">
            Nunca te quedes sin café. Ahorra 15% en cada entrega y cancela
            cuando quieras.
          </p>
          <Button
            size="lg"
            className="mt-8"
            render={<Link href="/catalogo">Ver cafés disponibles →</Link>}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid sm:grid-cols-3 gap-6">
        {STEPS.map((s) => (
          <div key={s.n}>
            <div className="size-10 rounded-full bg-foreground text-background grid place-items-center font-display font-semibold mb-4">
              {s.n}
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {s.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight mb-8">
            Beneficios del suscriptor
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4 text-left">
            {PERKS.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 rounded-md border border-border bg-background p-4 text-sm"
              >
                <span className="size-6 rounded-full bg-foreground text-background grid place-items-center text-xs font-bold">
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <Eyebrow>Algunos favoritos</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Empieza tu suscripción
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {subProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
