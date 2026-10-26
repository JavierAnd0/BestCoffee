import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listBrewGuides } from "@/lib/data/static";

export const metadata: Metadata = { title: "Guías de preparación · ORÍGEN Café" };

const GUIDE_IMAGES: Record<string, string> = {
  v60: "/img/products/v60-1.jpg",
  aeropress: "/img/molienda-barista.jpg",
  chemex: "/img/taza-granos.jpg",
  prensa: "/img/taza-granos.jpg",
  espresso: "/img/molienda-barista.jpg",
  default: "/img/molienda-barista.jpg",
};

export default async function GuiasIndex() {
  const guides = await listBrewGuides();
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
        {guides.map((g) => {
          const imgSrc =
            GUIDE_IMAGES[g.slug.toLowerCase()] ||
            (g.slug.includes("v60")
              ? GUIDE_IMAGES.v60
              : g.slug.includes("espresso")
              ? GUIDE_IMAGES.espresso
              : GUIDE_IMAGES.chemex);

          return (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="group rounded-xl border border-border bg-background p-5 hover:border-foreground/30 hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-muted rounded-lg mb-4 overflow-hidden">
                <Image
                  src={imgSrc}
                  alt={g.method}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {g.method}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {g.summary}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {g.totalTime}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {g.difficulty}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
