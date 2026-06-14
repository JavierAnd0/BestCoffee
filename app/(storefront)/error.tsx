"use client";

import { useEffect } from "react";
import { Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function CoffeeZero() {
  return (
    <span className="relative inline-block">
      <span className="select-none">0</span>
      <span
        aria-hidden
        className="absolute rounded-full bg-accent"
        style={{
          width: "14%",
          height: "17%",
          top: "46%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </span>
  );
}

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
      {/* 500 hero */}
      <div
        className="font-display font-semibold text-accent leading-none flex items-end gap-2"
        style={{ fontSize: "clamp(5rem, 16vw, 9.5rem)" }}
        aria-label="500"
      >
        <span className="select-none">5</span>
        <CoffeeZero />
        <CoffeeZero />
        <span className="eyebrow self-end mb-3 ml-2 text-left text-muted-foreground">
          Error del<br />servidor
        </span>
      </div>

      <h1 className="font-display italic font-medium text-4xl sm:text-5xl tracking-tight max-w-sm mt-8 mb-5">
        Ups… se nos derramó el café
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-8">
        Algo se rompió de nuestro lado —no fue culpa tuya. Nuestro equipo ya
        tiene el trapo en la mano y está limpiando el desastre.
      </p>

      <div className="border border-dashed border-accent/40 rounded px-5 py-3.5 max-w-sm mb-10 flex items-start gap-3 text-left">
        <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Estamos trabajando para arreglarlo · vuelve a intentar en unos minutos
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset} className="gap-2">
          <Check className="size-3.5" />
          Reintentar
        </Button>
        <Button size="lg" variant="outline" render={<a href="/">Volver al inicio</a>} />
      </div>
    </section>
  );
}
