import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function PlatformLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold">
            <Coffee className="size-5" strokeWidth={1.6} />
            BestCoffee
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#" className="text-foreground/80 hover:text-foreground">
              Cómo funciona
            </Link>
            <Link href="#" className="text-foreground/80 hover:text-foreground">
              Precios
            </Link>
            <Link href="/platform/login" className="text-foreground/80 hover:text-foreground">
              Iniciar sesión
            </Link>
            <Button
              size="sm"
              render={<Link href="/platform/onboarding">Crear tienda</Link>}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-32 text-center">
          <Eyebrow>Plataforma SaaS · Café de especialidad</Eyebrow>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
            La tienda en línea
            <br />
            que tu tostadora merece
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed">
            Una plataforma completa con catálogo, suscripciones recurrentes, panel
            de administración y contenido editorial. Diseñada para tostadores de
            café de especialidad.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              render={
                <Link href="/platform/onboarding">
                  Crear mi tienda <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="http://origen.localhost:3000">Ver demo de tienda</Link>}
            />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            La demo abre la tienda piloto ORÍGEN en otro subdominio.
          </p>
        </section>

        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Tienda pública",
                body: "Homepage editorial, catálogo con filtros, página de producto con suscripción, quiz de recomendación, blog y cuenta de cliente.",
              },
              {
                title: "Panel de administración",
                body: "Productos, colecciones, pedidos, suscripciones, clientes, contenido, promociones, reseñas y auditoría — todo en un mismo lugar.",
              },
              {
                title: "Motor de suscripciones",
                body: "Cobros recurrentes con Stripe, reintentos automáticos, recordatorios, pausas, saltos y suscripciones de regalo prepagadas.",
              },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 BestCoffee</span>
          <span>Hecho en Bogotá ☕</span>
        </div>
      </footer>
    </div>
  );
}
