import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireEditorialPage } from "@/lib/data/feature-guard";
import { getEditorialPage } from "@/lib/data/content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { EditorialText, PageImage, SectionFigure } from "@/components/storefront/editorial-page";

// Texto, cifras e imágenes de la propia tienda (panel → Contenido → Páginas).

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditorialPage("impacto");
  return page ? { title: page.title, description: page.intro } : { title: "Impacto" };
}

export default async function ImpactoPage() {
  await requireEditorialPage("impacto");
  const page = await getEditorialPage("impacto");
  if (!page) notFound();
  const hasImage = Boolean(page.imageUrl);
  const highlights = page.highlights ?? [];

  return (
    <>
      <section
        className={
          "relative isolate grid place-items-center overflow-hidden " + (hasImage ? "h-[440px]" : "py-20")
        }
      >
        {hasImage && (
          <>
            <PageImage
              url={page.imageUrl}
              alt={page.imageAlt}
              priority
              sizes="100vw"
              className="object-cover object-center brightness-[0.38]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background via-black/35 to-black/55"
            />
          </>
        )}
        <div
          className={
            "relative text-center px-6 max-w-2xl mx-auto space-y-3 " + (hasImage ? "text-white" : "")
          }
        >
          {page.eyebrow && <Eyebrow className={hasImage ? "text-white/80" : undefined}>{page.eyebrow}</Eyebrow>}
          <h1 className="mt-2 font-display text-5xl lg:text-7xl font-semibold tracking-tight">{page.title}</h1>
          {page.intro && (
            <p
              className={
                "mt-3 max-w-xl mx-auto text-sm sm:text-base leading-relaxed font-light " +
                (hasImage ? "text-white/85" : "text-muted-foreground")
              }
            >
              {page.intro}
            </p>
          )}
        </div>
      </section>

      {highlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((n, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="font-display text-5xl font-semibold tracking-tight">{n.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{n.label}</p>
            </div>
          ))}
        </section>
      )}

      {page.sections.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 space-y-6">
            {page.sections.map((s, i) => (
              <div key={i} className="space-y-6">
                {s.title && (
                  <h2 className={"font-display text-3xl font-semibold tracking-tight" + (i > 0 ? " pt-4" : "")}>
                    {s.title}
                  </h2>
                )}
                <EditorialText body={s.body} />
                <SectionFigure section={s} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
