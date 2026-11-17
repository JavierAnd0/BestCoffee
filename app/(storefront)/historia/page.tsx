import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireEditorialPage } from "@/lib/data/feature-guard";
import { getEditorialPage } from "@/lib/data/content";
import { Eyebrow } from "@/components/ui/eyebrow";
import { EditorialText, PageImage, SectionFigure } from "@/components/storefront/editorial-page";

// Texto e imágenes de la propia tienda (panel → Contenido → Páginas).

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditorialPage("historia");
  return page ? { title: page.title, description: page.intro } : { title: "Nuestra historia" };
}

export default async function HistoriaPage() {
  await requireEditorialPage("historia");
  const page = await getEditorialPage("historia");
  if (!page) notFound();
  const hasImage = Boolean(page.imageUrl);

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
              className="object-cover object-center brightness-[0.45]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/50"
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
                "text-sm sm:text-base max-w-lg mx-auto font-light leading-relaxed " +
                (hasImage ? "text-white/80" : "text-muted-foreground")
              }
            >
              {page.intro}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 space-y-7">
        {page.sections.map((s, i) => (
          <div key={i} className="space-y-7">
            {s.title && (
              <h2 className="font-display text-3xl font-semibold tracking-tight pt-8">{s.title}</h2>
            )}
            {/* El primer párrafo de la página, si abre sin título, va destacado. */}
            <EditorialText body={s.body} leadFirst={i === 0 && !s.title} />
            <SectionFigure section={s} />
          </div>
        ))}
      </div>
    </>
  );
}
