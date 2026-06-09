import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Roast } from "@/components/ui/roast";
import { Stars } from "@/components/ui/stars";
import { BuyBlock } from "@/components/storefront/buy-block";
import { ProductCard } from "@/components/storefront/product-card";
import { getProductBySlug, listRelated } from "@/lib/data/products";
import { getCurrentTenant } from "@/lib/data/tenant";

const TYPE_LABEL = {
  BLEND: "Mezcla",
  SINGLE_ORIGIN: "Origen único",
  DECAF: "Descafeinado",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, tenant] = await Promise.all([listRelated(product), getCurrentTenant()]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-xs text-muted-foreground mb-6">
          Inicio / Catálogo /{" "}
          <span className="text-foreground">{TYPE_LABEL[product.type]}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <Gallery alt={product.images[0]?.alt ?? product.name} />

          <div>
            <Badge variant="outline" className="font-normal uppercase tracking-[0.12em]">
              {TYPE_LABEL[product.type]}
              {product.origin ? ` · ${product.origin}` : ""}
            </Badge>
            <h1 className="mt-4 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <div className="mt-3">
              <Stars value={5} count={128} />
            </div>
            <div className="mt-6">
              <Roast level={product.roastLevel} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.flavorNotes.map((n) => (
                <Badge key={n} variant="outline" className="font-normal">
                  {n}
                </Badge>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-md">
              {product.shortDescription}
            </p>

            <div className="mt-10 border-t border-border pt-8">
              <BuyBlock
                product={product}
                subscriptionDiscountPct={tenant.subscriptionDiscountPct}
              />
            </div>
          </div>
        </div>
      </section>

      {product.producerStory && (
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div
              aria-label="Retrato del productor"
              className="aspect-[4/3] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
            >
              Retrato del productor
            </div>
            <div>
              <Eyebrow>Historia del origen</Eyebrow>
              <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-tight">
                {product.origin ?? "Sobre este café"}
              </h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                {product.producerStory}
              </p>
              {product.longDescription && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {product.longDescription}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <Reviews />

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Eyebrow>También te podría gustar</Eyebrow>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-tight">
              Más cafés
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} imageHeight={200} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Gallery({ alt }: { alt: string }) {
  return (
    <div className="space-y-3">
      <div
        aria-label={alt}
        className="aspect-square rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
      >
        {alt}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            aria-label={`Vista ${i + 1}`}
            className={
              "aspect-square rounded-md bg-muted/70 hover:ring-2 hover:ring-foreground/20 transition " +
              (i === 0 ? "ring-2 ring-foreground" : "")
            }
          />
        ))}
      </div>
    </div>
  );
}

function Reviews() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-[1fr_2fr] gap-12">
        <div>
          <Eyebrow>Reseñas</Eyebrow>
          <div className="mt-2 font-display text-6xl font-semibold tracking-tight">4.8</div>
          <div className="mt-2">
            <Stars value={5} size={18} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">128 reseñas verificadas</p>
          <div className="mt-6 space-y-2">
            {[
              [5, 82],
              [4, 12],
              [3, 4],
              [2, 1],
              [1, 1],
            ].map(([n, pct]) => (
              <div key={n} className="flex items-center gap-3 text-xs">
                <span className="w-6 tabular-nums text-muted-foreground">{n}★</span>
                <span className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <span className="block h-full bg-foreground/70" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 tabular-nums text-right text-muted-foreground">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {[
            { who: "María R.", body: "Excelente café, llegó fresco y con notas muy claras." },
            { who: "Andrés P.", body: "Mi rutina de la mañana cambió. La suscripción es comodísima." },
            { who: "Clara T.", body: "Es el mejor que he probado de origen único en Colombia." },
          ].map((r) => (
            <article key={r.who} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Stars value={5} size={13} />
                  <span className="text-xs text-muted-foreground">{r.who}</span>
                  <Badge variant="outline" className="font-normal">
                    Suscriptor
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">02 jun 2026</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
