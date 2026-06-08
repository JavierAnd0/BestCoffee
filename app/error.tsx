"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Telemetry hook — wire up Sentry / Vercel logs here once available.
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-4 py-20 text-center">
      <div className="max-w-md space-y-5">
        <Eyebrow>Algo salió mal</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Tuvimos un problema procesando tu solicitud
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ya nos llegó el aviso. Intenta de nuevo en unos segundos.
        </p>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="outline" render={<a href="/">Ir al inicio</a>} />
        </div>
      </div>
    </div>
  );
}
