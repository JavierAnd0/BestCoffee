import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Stars } from "@/components/ui/stars";
import { ReviewForm } from "@/components/storefront/review-form";
import type { ProductReviews } from "@/lib/data/reviews";

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Reseñas reales (aprobadas) de un producto + formulario para dejar una. */
export function ProductReviewsSection({
  productSlug,
  summary,
  sessionEmail,
}: {
  productSlug: string;
  summary: ProductReviews;
  sessionEmail: string | null;
}) {
  const { average, count, distribution, reviews } = summary;

  return (
    <section id="resenas" className="border-t border-border scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-[1fr_2fr] gap-12">
        <div>
          <Eyebrow>Reseñas</Eyebrow>
          {average != null ? (
            <>
              <div className="mt-2 font-display text-6xl font-semibold tracking-tight tabular-nums">
                {average.toLocaleString("es-CO")}
              </div>
              <div className="mt-2">
                <Stars value={Math.round(average)} size={18} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {count} {count === 1 ? "reseña publicada" : "reseñas publicadas"}
              </p>
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const pct = Math.round((distribution[n - 1] / count) * 100);
                  return (
                    <div key={n} className="flex items-center gap-3 text-xs">
                      <span className="w-6 tabular-nums text-muted-foreground">{n}★</span>
                      <span className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <span className="block h-full bg-foreground/70" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 tabular-nums text-right text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Este producto todavía no tiene reseñas. ¿Lo probaste? Cuéntanos qué te pareció.
            </p>
          )}
        </div>

        <div className="space-y-10">
          {reviews.length > 0 && (
            <div className="space-y-6">
              {reviews.map((r) => (
                <article key={r.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Stars value={r.rating} size={13} />
                      {r.verifiedSubscriber && (
                        <Badge variant="outline" className="font-normal">
                          Suscriptor
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <h3 className="mt-3 text-sm font-medium">{r.title}</h3>}
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {r.body}
                  </p>
                  {r.reply && (
                    <div className="mt-3 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                      <span className="block text-[11px] uppercase tracking-[0.12em] mb-1">
                        Respuesta de la tienda
                      </span>
                      {r.reply}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className={reviews.length > 0 ? "border-t border-border pt-8" : ""}>
            <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">
              Escribe una reseña
            </h2>
            <ReviewForm productSlug={productSlug} sessionEmail={sessionEmail} />
          </div>
        </div>
      </div>
    </section>
  );
}
