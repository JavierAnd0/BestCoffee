import Link from "next/link";
import type { HeroContent } from "@/lib/types";

/**
 * Hero del inicio para tiendas sin escena 3D propia: texto e identidad de la
 * marca sobre un fondo cálido con su color de acento. Componente de servidor,
 * sin JavaScript de cliente ni modelos que descargar.
 */
export function HeroClassic({
  content,
  brand,
  tagline,
}: {
  content: HeroContent;
  brand: string;
  tagline: string;
}) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 70% 40%, #3a1a0c 0%, #1c0904 55%, #0d0401 100%)",
        color: "#f7efe4",
      }}
    >
      {/* Halo con el color de acento de la tienda */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle 520px at 72% 42%, var(--accent) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-28 lg:py-40">
        <span
          className="inline-flex items-center gap-2.5 text-xs font-mono font-medium tracking-[0.22em] uppercase"
          style={{ color: "#e8b888" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          {content.eyebrow || tagline}
        </span>
        <h1 className="mt-5 max-w-3xl font-display font-light text-[clamp(2.6rem,6vw,5rem)] leading-[0.98] tracking-tight">
          {content.title || brand}
        </h1>
        {content.subtitle && (
          <p
            className="mt-6 max-w-xl text-base sm:text-lg font-light leading-relaxed"
            style={{ color: "rgba(244, 232, 217, 0.8)" }}
          >
            {content.subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Link
            href={content.ctaPrimaryHref}
            className="group inline-flex items-center gap-3 px-7 py-4 text-xs uppercase tracking-[0.18em] font-semibold rounded-full transition-transform duration-300 hover:scale-[1.02]"
            style={{ backgroundColor: "#f7efe4", color: "#1c0904" }}
          >
            {content.ctaPrimaryLabel}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          {content.ctaSecondaryHref && (
            <Link
              href={content.ctaSecondaryHref}
              className="text-sm font-normal border-b pb-0.5"
              style={{ color: "#f7efe4", borderColor: "rgba(247, 239, 228, 0.4)" }}
            >
              {content.ctaSecondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
