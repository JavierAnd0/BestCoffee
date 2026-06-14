"use client";

// Dedicated debug page for finding the perfect camera angle of the 3D model.
// Drag to orbit, scroll to zoom, then read the [CAM] log in the browser
// console. Delete this route once the final angle is baked into HeroModel.

import dynamic from "next/dynamic";

const HeroModel = dynamic(
  () => import("@/components/storefront/hero-model").then((m) => m.HeroModel),
  { ssr: false },
);

export default function DebugThreeD() {
  return (
    <div className="min-h-[100svh] grid place-items-center p-8 bg-foreground/95">
      <div className="w-full max-w-3xl space-y-6">
        <header className="text-background/90 space-y-2">
          <h1 className="font-display text-3xl font-light">3D model · debug</h1>
          <p className="text-sm text-background/60 leading-relaxed">
            Arrastra para rotar la cámara. Scroll en el canvas para zoom.
            Encuentra el ángulo deseado y mira la consola — busca líneas{" "}
            <code className="bg-background/10 px-1.5 py-0.5 rounded">[CAM]</code>
            . Copia los valores de <code>position</code> y pásamelos.
          </p>
        </header>

        <div
          className="relative w-full aspect-[4/3] rounded-lg overflow-hidden"
          style={{
            background:
              "linear-gradient(155deg,#0a0401 0%,#1c0905 42%,#301208 100%)",
          }}
        >
          <HeroModel
            debug
            autoRotateSpeed={0}
            floatIntensity={0}
          />
        </div>

        <p className="text-xs text-background/45">
          Ejemplo de lo que verás en consola:{" "}
          <code className="bg-background/10 px-1.5 py-0.5 rounded">
            [CAM] position=[0.50, 0.80, 2.75] rotation=[-0.27, 0.18, 0.05]
          </code>
        </p>
      </div>
    </div>
  );
}
