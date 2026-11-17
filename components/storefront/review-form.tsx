"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReviewAction, type ReviewFormState } from "@/lib/actions/reviews";

const FIELD =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";
const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5";

export function ReviewForm({
  productSlug,
  sessionEmail,
}: {
  productSlug: string;
  /** Correo de la cuenta con sesión; si existe no se pide en el formulario. */
  sessionEmail: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, dispatch, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    null,
  );

  if (state?.ok) {
    return (
      <p role="status" className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
        {state.message}
      </p>
    );
  }

  const shown = hover || rating;

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating || ""} />

      <fieldset>
        <legend className={LABEL}>Tu puntuación</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} de 5 estrellas`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5 cursor-pointer"
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={n <= shown ? "text-foreground" : "text-foreground/20"}
              >
                <path
                  d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.9 4.9 17.3 6 11.6 1.7 7.6l5.8-.7z"
                  fill="currentColor"
                />
              </svg>
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-xs text-muted-foreground">{rating} de 5</span>}
        </div>
      </fieldset>

      <label className="block">
        <span className={LABEL}>Título (opcional)</span>
        <input name="title" maxLength={120} className={FIELD} />
      </label>

      <label className="block">
        <span className={LABEL}>Tu reseña</span>
        <textarea name="body" required minLength={3} maxLength={2000} rows={4} className={FIELD} />
      </label>

      {sessionEmail ? (
        <p className="text-xs text-muted-foreground">
          Se enviará con tu cuenta ({sessionEmail}). Tu correo no se publica.
        </p>
      ) : (
        <label className="block">
          <span className={LABEL}>Correo</span>
          <input name="email" type="email" required maxLength={254} className={FIELD} />
          <span className="mt-1 block text-xs text-muted-foreground">No se publica.</span>
        </label>
      )}

      {state && !state.ok && (
        <p role="alert" className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-800">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || rating === 0}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enviar reseña
        </Button>
        <span className="text-xs text-muted-foreground">
          Las reseñas se publican después de que la tienda las modera.
        </span>
      </div>
    </form>
  );
}
