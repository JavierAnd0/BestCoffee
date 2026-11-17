import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16.4+ escribe un AGENTS.md en la raíz al correr `next dev`; el repo
  // es público y no lleva archivos de herramientas de agentes.
  agentRules: false,
  // Permite levantar un segundo `next dev` (p. ej. contra la API local de
  // pruebas) junto al de desarrollo: cada uno usa su propia carpeta de build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Modelos y texturas del hero 3D: por defecto salen con `max-age=0`, así que
  // cada navegación los revalidaba uno por uno antes de mostrar la escena.
  // Caché corta a propósito: los archivos no llevan hash en el nombre, y una
  // copia vieja junto a código nuevo rompería la escena tras un despliegue.
  async headers() {
    const cache = [
      {
        key: "Cache-Control",
        value: "public, max-age=300, must-revalidate",
      },
    ];
    // Paneles, cuenta y pago nunca deben aparecer en resultados de búsqueda.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    const privateAreas = ["/admin", "/platform/superadmin", "/cuenta", "/checkout", "/acceso", "/login", "/registro"];
    return [
      ...privateAreas.flatMap((p) => [
        { source: p, headers: noindex },
        { source: `${p}/:path*`, headers: noindex },
      ]),
      { source: "/models/:path*", headers: cache },
      { source: "/hero/:path*", headers: cache },
      { source: "/hdri/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
