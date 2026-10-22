import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de producto subidas a Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
