import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BREW_GUIDES } from "@/lib/mocks/static";

export const metadata: Metadata = { title: "Guías de preparación" };

export default function GuiasIndex() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="text-center max-w-2xl mx-auto mb-12">
        <Eyebrow>Guías de preparación</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Métodos paso a paso
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Recetas simples y proporciones que funcionan. Adapta el grano y la molienda
          a tu paladar.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BREW_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="rounded-lg border border-border bg-background p-6 hover:border-foreground/30 transition-colors"
          >
            <div className="aspect-[4/3] bg-muted rounded-md mb-4" aria-hidden />
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {g.method}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {g.summary}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {g.totalTime}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {g.difficulty}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
