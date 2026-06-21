"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { useCart } from "./cart-context";
import type { TenantFeatures } from "@/lib/types";

type NavLink = { href: string; label: string };

// Links que dependen de una feature. Si la tienda no la tiene (tier bajo),
// el enlace no se muestra para no llevar a páginas vacías o bloqueadas.
function buildLinks(features?: TenantFeatures) {
  const subs = features?.subscriptions ?? true;

  const left: NavLink[] = [
    { href: "/catalogo", label: "Catálogo" },
    ...(subs ? [{ href: "/suscripciones", label: "Suscripciones" }] : []),
    { href: "/tiendas", label: "Tiendas" },
  ];

  const right: NavLink[] = [{ href: "/blog", label: "Aprende" }];

  const mobile: NavLink[] = [
    { href: "/catalogo", label: "Catálogo" },
    ...(subs ? [{ href: "/suscripciones", label: "Suscripciones" }] : []),
    { href: "/quiz", label: "Encuentra tu café" },
    { href: "/blog", label: "Blog" },
    { href: "/guias", label: "Guías de preparación" },
    { href: "/tiendas", label: "Tiendas" },
    { href: "/historia", label: "Nuestra historia" },
    { href: "/impacto", label: "Impacto" },
    { href: "/mayoristas", label: "Mayoristas" },
  ];

  return { left, right, mobile };
}

export function Header({
  brand,
  features,
}: {
  brand?: string;
  features?: TenantFeatures;
}) {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const { left: LEFT_LINKS, right: RIGHT_LINKS, mobile: MOBILE_LINKS } =
    buildLinks(features);
  // Catálogo de solo lectura (STARTER): sin carrito. Cuentas de cliente: PRO+.
  const showCart = features?.checkout ?? true;
  const showAccount = features?.customerAccounts ?? true;

  return (
    <header className="border-b border-line bg-background/92 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
        {/* Mobile: hamburger | logo | cart  */}
        <div className="lg:hidden flex items-center justify-between gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="text-foreground/80 hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <Logo size={20} brand={brand} />
          {showCart ? (
            <button
              onClick={open}
              aria-label={`Carrito (${count})`}
              className="relative flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="text-xs font-semibold tabular-nums">{count}</span>
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
        </div>

        {/* Desktop: nav | logo | actions */}
        <div className="hidden lg:grid grid-cols-3 items-center gap-6">
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
            <button aria-label="Buscar" className="text-foreground/80 hover:text-foreground">
              <Search className="size-[18px]" />
            </button>
            {showAccount && (
              <Link href="/cuenta" aria-label="Cuenta" className="text-foreground/80 hover:text-foreground">
                <User className="size-[18px]" />
              </Link>
            )}
            {showCart && (
              <button
                onClick={open}
                aria-label={`Carrito (${count})`}
                className="relative flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
              >
                <ShoppingBag className="size-[18px]" />
                {count > 0 && (
                  <span className="text-xs font-semibold tabular-nums">{count}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <Logo size={20} brand={brand} />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="text-foreground/80 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="px-4 py-6 space-y-1">
            {MOBILE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-3 text-base text-foreground hover:bg-muted transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {showAccount && (
              <Link
                href="/cuenta"
                onClick={() => setMenuOpen(false)}
                className="mt-6 block rounded-md px-3 py-3 text-base font-medium border border-border hover:bg-muted transition-colors"
              >
                <User className="size-4 inline mr-2" />
                Mi cuenta
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
