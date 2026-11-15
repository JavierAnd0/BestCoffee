"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/types";

/** Galería de la ficha de producto: imagen grande + miniaturas. */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const valid = images.filter((i) => !broken.has(i.id));
  const [selectedId, setSelectedId] = useState<string | undefined>(images[0]?.id);
  const current = valid.find((i) => i.id === selectedId) ?? valid[0];

  const markBroken = (id: string) => setBroken((s) => new Set(s).add(id));

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            onError={() => markBroken(current.id)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            {name}
          </div>
        )}
      </div>

      {valid.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {valid.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Vista ${i + 1}`}
              aria-pressed={img.id === current?.id}
              onClick={() => setSelectedId(img.id)}
              className={
                "relative aspect-square overflow-hidden rounded-md bg-muted transition " +
                (img.id === current?.id
                  ? "ring-2 ring-foreground"
                  : "opacity-70 hover:opacity-100 hover:ring-2 hover:ring-foreground/20")
              }
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
                onError={() => markBroken(img.id)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

