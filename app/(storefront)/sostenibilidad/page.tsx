import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, Sprout, HeartHandshake, Recycle, ArrowRight } from "lucide-react";
import { requireEditorialPage } from "@/lib/data/feature-guard";
import { getEditorialPage } from "@/lib/data/content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { EditorialText, PageImage } from "@/components/storefront/editorial-page";

// Texto, cifras e imágenes de la propia tienda (panel → Contenido → Páginas).
// Cada sección se muestra como una tarjeta ("pilar"); los iconos son decorativos.

const ICONS = [HeartHandshake, Sprout, Recycle, Leaf];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditorialPage("sostenibilidad");
  return page ? { title: page.title, description: page.intro } : { title: "Sostenibilidad" };
}

export default async function SostenibilidadPage() {
  await requireEditorialPage("sostenibilidad");
  const page = await getEditorialPage("sostenibilidad");
  if (!page) notFound();
  const highlights = page.highlights ?? [];
  const cta = page.cta;
  const hasCtaBox = Boolean(cta && (cta.title || cta.body || cta.href || cta.secondaryHref));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <section className="mb-16 text-center max-w-3xl mx-auto">
        {page.eyebrow && <Eyebrow>{page.eyebrow}</Eyebrow>}
        <h1 className="mt-3 font-display text-5xl lg:text-6xl font-semibold tracking-tight">{page.title}</h1>
        {page.intro && (
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{page.intro}</p>
        )}
      </section>

      {page.imageUrl && (
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden mb-16 shadow-lg border border-border">
          <PageImage
            url={page.imageUrl}
            alt={page.imageAlt}
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {page.imageCaption && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6 sm:p-10">
              <p className="text-white font-display text-xl sm:text-2xl font-light drop-shadow-md">
                {page.imageCaption}
              </p>
            </div>
          )}
        </div>
      )}

      {highlights.length > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-y border-border mb-16">
          {highlights.map((m, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-4xl lg:text-5xl font-semibold text-primary">{m.value}</div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </section>
      )}

      {page.sections.length > 0 && (
        <section className="mb-20">
          {(page.sectionsEyebrow || page.sectionsTitle) && (
            <div className="text-center max-w-2xl mx-auto mb-12">
              {page.sectionsEyebrow && <Eyebrow>{page.sectionsEyebrow}</Eyebrow>}
              {page.sectionsTitle && (
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{page.sectionsTitle}</h2>
              )}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-8">
            {page.sections.map((s, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-8 text-card-foreground space-y-4 hover:border-border/80 transition-colors"
                >
                  <div className="size-12 rounded-xl bg-emerald-500/10 grid place-items-center">
                    <Icon className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </div>
                  {s.title && <h3 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h3>}
                  <EditorialText body={s.body} className="text-sm text-muted-foreground leading-relaxed" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasCtaBox && cta && (
        <section className="rounded-2xl border border-border bg-muted/40 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            {cta.title && <h3 className="font-display text-3xl font-semibold tracking-tight">{cta.title}</h3>}
            {cta.body && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{cta.body}</p>}
          </div>
          <div className="flex flex-wrap gap-4">
            {cta.secondaryLabel && cta.secondaryHref && (
              <Link href={cta.secondaryHref}>
                <Button variant="outline" className="gap-2">
                  {cta.secondaryLabel}
                </Button>
              </Link>
            )}
            {cta.label && cta.href && (
              <Link href={cta.href}>
                <Button className="gap-2">
                  {cta.label} <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
