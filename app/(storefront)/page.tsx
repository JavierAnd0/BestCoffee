import Link from "next/link";
import { Hero } from "@/components/storefront/hero";
import { FeaturedPack } from "@/components/storefront/featured-pack";
import { QuizBand } from "@/components/storefront/quiz-band";
import { Spotlight } from "@/components/storefront/spotlight";
import { ProductCard } from "@/components/storefront/product-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  HERO_HOME,
  FEATURED_PACK_HOME,
  SPOTLIGHT_HOME,
} from "@/lib/mocks/site-content";
import { bestsellers } from "@/lib/mocks/products";

const TABS = ["Todos", "Mezclas", "Origen único", "Descafeinado", "Cold brew"];

export default function StorefrontHome() {
  const featured = bestsellers().slice(0, 4);

  return (
    <>
      <Hero content={HERO_HOME} />

      <FeaturedPack content={FEATURED_PACK_HOME} />

      <QuizBand />

      <Spotlight content={SPOTLIGHT_HOME} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-3 mb-12">
          <Eyebrow>Catálogo</Eyebrow>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight">
            Los más vendidos
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={
                "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                (i === 0
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Link
            href="/catalogo"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver todo el catálogo →
          </Link>
        </div>
      </section>
    </>
  );
}
