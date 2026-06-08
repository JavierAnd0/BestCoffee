import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Tienda", links: ["Catálogo", "Suscripciones", "Paquetes", "Accesorios"] },
  { title: "Aprende", links: ["Guías de preparación", "Blog", "Origen"] },
  { title: "Empresa", links: ["Nuestra historia", "Sostenibilidad", "Mayoristas"] },
  { title: "Ayuda", links: ["Contacto", "Envíos", "Devoluciones"] },
];

export function Footer({ brand = "ORÍGEN" }: { brand?: string }) {
  return (
    <footer className="border-t border-border bg-muted/40 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div className="max-w-md">
          <div className="font-display text-3xl font-semibold tracking-tight">
            Únete al club
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Historias de café, lanzamientos y un descuento de bienvenida a tu correo.
          </p>
          <form className="mt-5 flex items-center gap-2 border-b border-foreground/30 pb-2">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="sm">
              Suscribir
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground mb-4">
                {c.title}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="hover:text-foreground transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={16} brand={brand} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            © 2026 {brand} · Términos · Privacidad · Devoluciones
          </span>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="size-6 rounded-full border border-border bg-background"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
