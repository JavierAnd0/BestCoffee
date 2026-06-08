import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import type { HeroContent } from "@/lib/types";

export function Hero({ content }: { content: HeroContent }) {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Hero principal"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#3b2418] via-[#5a3826] to-[#a25234]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-overlay opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.6) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 lg:py-40 text-center text-white">
        <Eyebrow className="text-white/80">{content.eyebrow}</Eyebrow>
        <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
          {content.title.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {content.subtitle && (
          <p className="mt-6 max-w-xl mx-auto text-base text-white/85 leading-relaxed">
            {content.subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            render={<Link href={content.ctaPrimaryHref}>{content.ctaPrimaryLabel}</Link>}
          />
          {content.ctaSecondaryLabel && content.ctaSecondaryHref && (
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/40 hover:bg-white hover:text-foreground"
              render={
                <Link href={content.ctaSecondaryHref}>{content.ctaSecondaryLabel}</Link>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
