import type { Metadata } from "next";
import localFont from "next/font/local";
import { PlatformLanding } from "@/components/platform/landing/landing";
import { validContact } from "@/lib/demo-plan";
import { env } from "@/lib/env";

// Fuentes propias de la landing de la plataforma (app/fonts, licencia OFL,
// subconjunto latino). Las tiendas no las cargan: tienen su propio sistema.
const funnelDisplay = localFont({
  variable: "--font-funnel-display",
  display: "swap",
  src: [{ path: "../fonts/funnel-display-latin-wght-normal.woff2", weight: "300 800", style: "normal" }],
  fallback: ["system-ui", "sans-serif"],
});

const funnelSans = localFont({
  variable: "--font-funnel-sans",
  display: "swap",
  src: [{ path: "../fonts/funnel-sans-latin-wght-normal.woff2", weight: "300 800", style: "normal" }],
  fallback: ["system-ui", "sans-serif"],
});

/**
 * Tienda de ejemplo en `<slug>.<NEXT_PUBLIC_PLATFORM_DOMAIN>` (la tienda por
 * defecto). Sin dominio de plataforma configurado no hay enlace.
 */
function demoStoreUrl(): string | null {
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!domain || !env.defaultTenantSlug) return null;
  const local = /(^|\.)localhost(:\d+)?$/.test(domain);
  return `${local ? "http" : "https"}://${env.defaultTenantSlug}.${domain}`;
}

export const metadata: Metadata = {
  title: "Bestkofi · La tienda en línea de tu tostadora",
  description:
    "Tienda en línea para cafeterías y tostadoras de Colombia: catálogo, pedidos, suscripciones y blog con tu marca. Enciende solo lo que necesitas.",
};

export default function PlatformLandingPage() {
  // "Solicitar mi tienda": aún no hay alta automática (las tiendas las crea el
  // superadmin), así que abre un correo a PLATFORM_CONTACT_EMAIL con lo que el
  // visitante armó. Sin esa variable no se muestra.
  const contactEmail = validContact(process.env.PLATFORM_CONTACT_EMAIL);
  return (
    <div className={`${funnelDisplay.variable} ${funnelSans.variable}`}>
      <PlatformLanding demoUrl={demoStoreUrl()} contactEmail={contactEmail} />
    </div>
  );
}
