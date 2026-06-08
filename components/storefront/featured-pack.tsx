import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatCop } from "@/lib/format";
import type { FeaturedPackContent } from "@/lib/types";

export function FeaturedPack({ content }: { content: FeaturedPackContent }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div
          aria-label={`Imagen de ${content.title}`}
          className="aspect-[5/4] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
        >
          {content.title}
        </div>
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            {content.title}
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
            {content.description}
          </p>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold tabular-nums">
              {formatCop(content.priceCents)}
            </span>
            <span className="text-sm text-muted-foreground">
              {content.bagsCount} bolsas · ahorra {content.savingsPct}%
            </span>
          </div>
          <Button
            className="mt-6"
            render={<Link href={`/p/${content.productSlug}`}>Agregar al carrito</Link>}
          />
        </div>
      </div>
    </section>
  );
}
