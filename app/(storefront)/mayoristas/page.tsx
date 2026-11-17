import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { requireEditorialPage } from "@/lib/data/feature-guard";
import { getEditorialPage } from "@/lib/data/content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { EditorialText, PageImage } from "@/components/storefront/editorial-page";

// Texto e imágenes de la propia tienda (panel → Contenido → Páginas). El
// contacto es el de la página o, si no lo indica, el de la tienda: no hay
// formulario que no llegue a ninguna parte.

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditorialPage("mayoristas");
  return page ? { title: page.title, description: page.intro } : { title: "Mayoristas" };
}

export default async function MayoristasPage() {
  await requireEditorialPage("mayoristas");
  const [page, tenant] = await Promise.all([getEditorialPage("mayoristas"), getCurrentTenant()]);
  if (!page) notFound();

  const email = page.contact?.email ?? tenant.branding.contactEmail;
  const phone = page.contact?.phone ?? tenant.branding.contactPhone;
  const cta = page.cta;
  const hasContact = Boolean(email || phone || (cta?.label && cta?.href));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-10 text-center max-w-2xl mx-auto">
        {page.eyebrow && <Eyebrow>{page.eyebrow}</Eyebrow>}
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">{page.title}</h1>
        {page.intro && <p className="mt-4 text-base text-muted-foreground">{page.intro}</p>}
      </header>

      {page.imageUrl && (
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden mb-12 shadow-md border border-border">
          <PageImage
            url={page.imageUrl}
            alt={page.imageAlt}
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {page.imageCaption && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6 sm:p-8">
              <p className="text-white font-display text-lg sm:text-xl font-light">{page.imageCaption}</p>
            </div>
          )}
        </div>
      )}

      {page.sections.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-6 mb-16">
          {page.sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-6">
              {s.title && <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>}
              <div className="mt-2 space-y-2">
                <EditorialText body={s.body} className="text-sm text-muted-foreground leading-relaxed" />
              </div>
            </div>
          ))}
        </section>
      )}

      {hasContact && (
        <section className="rounded-lg border border-border bg-background p-8 space-y-4 max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {cta?.title || "Escríbenos"}
          </h2>
          {cta?.body && <p className="text-sm text-muted-foreground leading-relaxed">{cta.body}</p>}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
            {cta?.label && cta.href && (
              <Button size="lg" className="h-12 text-base" render={<Link href={cta.href}>{cta.label}</Link>} />
            )}
            {email && (
              <Button
                size="lg"
                variant={cta?.label ? "outline" : "default"}
                className="h-12 text-base gap-2"
                render={
                  <a href={`mailto:${email}`}>
                    <Mail className="size-4" /> {email}
                  </a>
                }
              />
            )}
            {phone && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 text-base gap-2"
                render={
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    <Phone className="size-4" /> {phone}
                  </a>
                }
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
