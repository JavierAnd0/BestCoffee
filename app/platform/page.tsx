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
  title: "Bestkofi · Sitios web a la medida para marcas de café",
  description:
    "Diseñamos el sitio de tu tostadora o cafetería con tu marca: vitrina, tienda en línea, suscripciones y blog. Tú eliges lo que necesitas; nosotros nos encargamos de todo lo demás.",
};

/** Número de WhatsApp en formato internacional (solo dígitos, 8 a 15) o null. */
function validWhatsapp(raw: string | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export default function PlatformLandingPage() {
  // Contacto de la plataforma. Aún no hay alta automática (las tiendas las crea
  // el superadmin): el formulario llega por correo a PLATFORM_CONTACT_EMAIL y
  // WhatsApp abre un chat con PLATFORM_WHATSAPP. Un canal sin variable no se
  // muestra. La página es estática: un cambio en estas variables pide un nuevo
  // despliegue.
  const contactEmail = validContact(process.env.PLATFORM_CONTACT_EMAIL);
  const whatsapp = validWhatsapp(process.env.PLATFORM_WHATSAPP);
  return (
    <div className={`${funnelDisplay.variable} ${funnelSans.variable}`}>
      <PlatformLanding demoUrl={demoStoreUrl()} contactEmail={contactEmail} whatsapp={whatsapp} />
    </div>
  );
}
