import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { env } from "@/lib/env";

/**
 * Tienda de ejemplo en `<slug>.<NEXT_PUBLIC_PLATFORM_DOMAIN>` (la tienda por
 * defecto). Sin dominio de plataforma configurado no hay enlace.
 */
function demoStoreUrl(): string | null {
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!domain || !env.defaultTenantSlug) return null;
  const local = /(^|\.)localhost(:\d+)?$/.test(domain);
  return `${local ? "http" : "https"}://${env.defaultTenantSlug}.${domain}`;
}

/**
 * "Solicitar mi tienda": aún no hay alta automática (las tiendas las crea el
 * superadmin), así que el botón abre un correo a PLATFORM_CONTACT_EMAIL. Sin
 * esa variable no se muestra (nunca se cae al correo personal del dueño).
 */
function requestStoreHref(): string | null {
  const email = process.env.PLATFORM_CONTACT_EMAIL?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const subject = encodeURIComponent("Quiero mi tienda en BestCoffee");
  const body = encodeURIComponent(
    "Hola, quiero abrir la tienda en línea de mi tostadora.\n\nNombre de la marca:\nCiudad:\nQué vendo (café, accesorios, suscripciones):\n",
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export const metadata: Metadata = {
  title: "BestCoffee · Tiendas en línea para tostadores de café",
  description:
    "Catálogo, suscripciones, panel de administración y contenido editorial para tostadores de café de especialidad.",
};

export default function PlatformLanding() {
  const demoUrl = demoStoreUrl();
  const requestUrl = requestStoreHref();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold">
            <Coffee className="size-5" strokeWidth={1.6} />
            BestCoffee
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#funciones" className="text-foreground/80 hover:text-foreground">
              Qué incluye
            </Link>
            <Link href="/acceso" className="text-foreground/80 hover:text-foreground">
              Iniciar sesión
            </Link>
            {requestUrl && (
              <Button size="sm" render={<a href={requestUrl}>Solicitar mi tienda</a>} />
            )}
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
            {requestUrl && (
              <Button
                size="lg"
                render={
                  <a href={requestUrl}>
                    Solicitar mi tienda <ArrowRight className="size-4" />
                  </a>
                }
              />
            )}
            {demoUrl && (
              <Button
                size="lg"
                variant="outline"
                render={<a href={demoUrl}>Ver demo de tienda</a>}
              />
            )}
          </div>
          {demoUrl && (
            <p className="mt-6 text-xs text-muted-foreground">
              La demo abre una tienda de ejemplo en su propio subdominio.
            </p>
          )}
        </section>

        <section id="funciones" className="scroll-mt-6 border-t border-border bg-muted/40">
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
                body: "Suscripciones recurrentes con pedido automático en cada renovación, aviso al cliente, pausas, saltos y suscripciones de regalo prepagadas.",
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
