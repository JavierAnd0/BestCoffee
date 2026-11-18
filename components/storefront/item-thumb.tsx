"use client";

import { useState } from "react";
import Image from "next/image";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Miniatura de un artículo (carrito, resumen, pedido). Sin imagen, o si no
 * carga, muestra un respaldo neutro con un ícono en vez de un recuadro vacío.
 */
export function ItemThumb({
  src,
  alt,
  className,
  sizes = "80px",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [broken, setBroken] = useState(false);
  const show = !!src && !broken;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-muted grid place-items-center",
        className,
      )}
    >
      {show ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <Coffee className="size-1/3 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  );
}
