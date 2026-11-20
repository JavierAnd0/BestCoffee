import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

// Fuentes servidas desde el repo (app/fonts, licencia OFL, subconjunto latino):
// el build ya no depende de descargar Google Fonts, que a veces fallaba.
const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [{ path: "./fonts/dm-sans-latin-wght-normal.woff2", weight: "300 500", style: "normal" }],
  fallback: ["system-ui", "sans-serif"],
});

const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "./fonts/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-wght-italic.woff2", weight: "300 700", style: "italic" },
  ],
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  // Raíz neutra: es común a la plataforma, los paneles y TODAS las tiendas.
  // Cada tienda pone su propia marca en el layout del storefront; aquí no va
  // el nombre de ninguna.
  title: {
    default: "Bestkofi",
    template: "%s",
  },
  description: "Tiendas en línea de café de especialidad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
