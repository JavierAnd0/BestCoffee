"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ContentTab {
  href: string;
  label: string;
}

/** Pestañas de Contenido: inicio, blog, guías, sedes y páginas (según el plan). */
export function ContentTabs({ tabs }: { tabs: ContentTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de contenido" className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
      {tabs.map((t) => {
        const active =
          t.href === "/admin/contenido"
            ? pathname === t.href || pathname.startsWith("/admin/contenido/bloques")
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={
              "px-3 py-2 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors " +
              (active
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
