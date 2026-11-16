import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TenantBranding } from "@/lib/types";

/**
 * Cierre del inicio para una tienda sin catálogo (por ejemplo, solo landing):
 * en vez de un aviso de "estamos preparando", invita a contactar con los datos
 * que la propia tienda tiene cargados. Un dato vacío no se muestra.
 */
export function LandingContact({ branding }: { branding: TenantBranding }) {
  const rows: { label: string; value: string; href?: string }[] = [];
  if (branding.city) rows.push({ label: "Ciudad", value: branding.city });
  if (branding.contactEmail) {
    rows.push({ label: "Correo", value: branding.contactEmail, href: `mailto:${branding.contactEmail}` });
  }
  if (branding.contactPhone) {
    const digits = branding.contactPhone.replace(/[^\d+]/g, "");
    rows.push({ label: "Teléfono", value: branding.contactPhone, href: `tel:${digits}` });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] text-balance">
            Hablemos de café
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/70 text-pretty">
            Cuéntanos qué necesitas y conversemos.
          </p>
          <Link
            href="/contacto"
            className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-foreground px-7 text-xs font-semibold uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-80 active:translate-y-px"
          >
            Escríbenos
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        {rows.length > 0 && (
          <dl className="divide-y divide-border border-y border-border lg:col-span-5 lg:col-start-8 lg:self-end">
            {rows.map((r) => (
              <div key={r.label} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <dt className="eyebrow sm:w-24 sm:shrink-0">{r.label}</dt>
                <dd className="text-base">
                  {r.href ? (
                    <a
                      href={r.href}
                      className="inline-flex min-h-11 items-center underline underline-offset-4 decoration-border hover:decoration-foreground"
                    >
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
