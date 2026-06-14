import Link from "next/link";
import { ScrollStory } from "@/components/storefront/scroll-story";
import { FeaturedPack } from "@/components/storefront/featured-pack";
import { QuizBand } from "@/components/storefront/quiz-band";
import { Spotlight } from "@/components/storefront/spotlight";
import { ProductCard } from "@/components/storefront/product-card";
import { getHomeHero, getHomeSpotlight, getFeaturedPack } from "@/lib/data/content";
import { listBestsellers } from "@/lib/data/products";
import { CatalogHeader } from "@/components/storefront/catalog-header";

export default async function StorefrontHome() {
  const [hero, spotlight, featuredPack, bestsellers] = await Promise.all([
    getHomeHero(),
    getHomeSpotlight(),
    getFeaturedPack(),
    listBestsellers(),
  ]);
  const featured = bestsellers.slice(0, 4);

  return (
    <>
      <ScrollStory content={hero} />

      <FeaturedPack content={featuredPack} />

      <QuizBand />

      <Spotlight content={spotlight} />

      {/* ── Catalog — magazine asymmetric grid ── */}
      <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-24 lg:py-32">

        <CatalogHeader />

        {/* Asymmetric grid: 1 featured large + 3 portrait */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 lg:gap-x-8 gap-y-12 lg:gap-y-0">
          {featured[0] && (
            <div className="col-span-2 lg:col-span-5">
              <ProductCard product={featured[0]} imageHeight={360} />
            </div>
          )}
          <div className="col-span-2 lg:col-span-7 grid grid-cols-3 gap-x-6 lg:gap-x-7 gap-y-10">
            {featured.slice(1).map((p) => (
              <ProductCard key={p.id} product={p} imageHeight={220} />
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6">
          <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2.5 eyebrow hover:text-foreground transition-colors duration-200"
          >
            Ver todo el catálogo
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
