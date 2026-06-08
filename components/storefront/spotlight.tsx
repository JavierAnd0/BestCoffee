import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Roast } from "@/components/ui/roast";
import { formatCop } from "@/lib/format";
import type { SpotlightContent } from "@/lib/types";

export function Spotlight({ content }: { content: SpotlightContent }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            {content.title}
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
            {content.body}
          </p>
          <div className="mt-6">
            <Roast level={content.roastLevel} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {content.flavorNotes.map((n) => (
              <Badge key={n} variant="outline" className="font-normal">
                {n}
              </Badge>
            ))}
          </div>
          <div className="mt-8 flex items-baseline gap-5">
            <span className="font-display text-2xl font-semibold tabular-nums">
              {formatCop(content.priceCents)}
            </span>
            <Button
              render={<Link href={`/p/${content.productSlug}`}>Comprar este origen</Link>}
            />
          </div>
        </div>

        <div
          aria-label={content.imageAlt}
          className="order-1 lg:order-2 aspect-[4/5] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
        >
          {content.imageAlt}
        </div>
      </div>
    </section>
  );
}
