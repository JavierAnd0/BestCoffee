"use client";

import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";
import { Logo } from "./logo";
import { useCart } from "./cart-context";

const LEFT_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/suscripciones", label: "Suscripciones" },
  { href: "/tiendas", label: "Tiendas" },
];

const RIGHT_LINKS = [{ href: "/blog", label: "Aprende" }];

export function Header({ brand }: { brand?: string }) {
  const { count, open } = useCart();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-3 items-center gap-6">
        <nav className="flex items-center gap-6 text-sm">
          {LEFT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex justify-center">
          <Logo size={22} brand={brand} />
        </div>
        <div className="flex items-center justify-end gap-5 text-sm">
          {RIGHT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <button
            aria-label="Buscar"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            <Search className="size-[18px]" />
          </button>
          <Link
            href="/cuenta"
            aria-label="Cuenta"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            <User className="size-[18px]" />
          </Link>
          <button
            onClick={open}
            aria-label={`Carrito (${count})`}
            className="relative flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors"
          >
            <ShoppingBag className="size-[18px]" />
            {count > 0 && (
              <span className="text-xs font-semibold tabular-nums">{count}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
