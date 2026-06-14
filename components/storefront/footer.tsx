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
    <footer
      className="mt-0"
      style={{ background: "linear-gradient(180deg,#120804 0%,#0a0401 100%)" }}
    >
      {/* Newsletter + links */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 xl:px-24 py-20 grid gap-14 lg:grid-cols-[1fr_2fr]">
        <div className="max-w-sm">
          <h3 className="font-display font-light text-[1.75rem] text-white leading-tight tracking-tight">
            Únete al club
          </h3>
          <p className="mt-3 text-sm text-white/44 font-light leading-relaxed">
            Historias de café, lanzamientos y un descuento de bienvenida.
          </p>
          <form className="mt-6 flex items-center gap-2 border-b border-white/18 pb-2">
            <input
              type="email"
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-white/30 mb-5">{c.title}</p>
              <ul className="space-y-2.5 text-sm text-white/40 font-light">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="hover:text-white/80 transition-colors duration-150">
                      {l}
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
          <span className="text-[11px] text-white/25 tracking-wide">
            © 2026 {brand} · Términos · Privacidad · Devoluciones
          </span>
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
