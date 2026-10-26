"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Logo } from "./logo";

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Tienda",
    links: [
      { label: "Catálogo", href: "/catalogo" },
      { label: "Suscripciones", href: "/suscripciones" },
      { label: "Paquetes", href: "/catalogo?coleccion=paquetes" },
      { label: "Accesorios", href: "/accesorios" },
      { label: "Nuestras tiendas", href: "/tiendas" },
    ],
  },
  {
    title: "Aprende",
    links: [
      { label: "Guías de preparación", href: "/guias" },
      { label: "Blog", href: "/blog" },
      { label: "Origen", href: "/historia" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Nuestra historia", href: "/historia" },
      { label: "Sostenibilidad", href: "/sostenibilidad" },
      { label: "Mayoristas", href: "/mayoristas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Contacto", href: "/contacto" },
      { label: "Envíos", href: "/envios" },
      { label: "Devoluciones", href: "/devoluciones" },
    ],
  },
];

export function Footer({ brand = "ORÍGEN" }: { brand?: string }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setSubscribed(true);
    toast({
      title: "¡Bienvenido al club!",
      description: "Te hemos suscrito a nuestro boletín de café especial.",
    });
    setEmail("");
  }

  return (
    <footer
      className="mt-0"
      style={{ background: "linear-gradient(180deg,#120804 0%,#0a0401 100%)" }}
    >
      {/* Newsletter + links */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-20 grid gap-14 lg:grid-cols-[1fr_2fr]">
        <div className="max-w-sm">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-newsletter-modal"));
              }
            }}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <h3 className="font-display font-light text-[1.75rem] text-white leading-tight tracking-tight group-hover:text-amber-200/90 transition-colors">
              Únete al club
            </h3>
          </button>
          <p className="mt-3 text-sm text-white/44 font-light leading-relaxed">
            Historias de café, lanzamientos y un descuento de bienvenida.
          </p>

          {subscribed ? (
            <p className="mt-6 text-xs text-white/70 bg-white/5 border border-white/10 p-3 rounded">
              ✓ Gracias por suscribirte. Revisa tu correo pronto.
            </p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex items-center gap-2 border-b border-white/18 pb-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/25 text-white font-light"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-white! text-foreground! hover:bg-white/90! border-transparent! text-xs! rounded-sm!"
              >
                →
              </Button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-white/30 mb-5">{c.title}</p>
              <ul className="space-y-2.5 text-sm text-white/40 font-light">
                {c.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-white/80 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={15} brand={brand} className="text-white/25" />
          <div className="text-[11px] text-white/25 tracking-wide flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>© 2026 {brand}</span>
            <span>·</span>
            <Link href="/legal/terminos" className="hover:text-white/60 transition-colors">
              Términos
            </Link>
            <span>·</span>
            <Link href="/legal/privacidad" className="hover:text-white/60 transition-colors">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/devoluciones" className="hover:text-white/60 transition-colors">
              Devoluciones
            </Link>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="size-6 rounded-none border"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", borderRadius: "1px" }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
