import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Modelos y texturas del hero 3D: por defecto salen con `max-age=0`, así que
  // cada visita los revalidaba uno por uno antes de mostrar la escena. Un día
  // de caché + una semana sirviendo la copia mientras se revalida en segundo
  // plano. (No `immutable`: los archivos no llevan hash en el nombre.)
  async headers() {
    const cache = [
      {
        key: "Cache-Control",
        value: "public, max-age=86400, stale-while-revalidate=604800",
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
