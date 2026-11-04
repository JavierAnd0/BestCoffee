"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const accessories = features?.accessories ?? true;

  const left: NavLink[] = [
    { href: "/catalogo", label: "Catálogo" },
    ...(subs ? [{ href: "/suscripciones", label: "Suscripciones" }] : []),
    ...(accessories ? [{ href: "/accesorios", label: "Accesorios" }] : []),
    { href: "/tiendas", label: "Tiendas" },
  ];

  const right: NavLink[] = [{ href: "/blog", label: "Aprende" }];

  const mobile: NavLink[] = [
    { href: "/catalogo", label: "Catálogo" },
    ...(subs ? [{ href: "/suscripciones", label: "Suscripciones" }] : []),
    ...(accessories ? [{ href: "/accesorios", label: "Accesorios" }] : []),
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
  const pathname = usePathname();
  const router = useRouter();
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { left: LEFT_LINKS, right: RIGHT_LINKS, mobile: MOBILE_LINKS } =
    buildLinks(features);
  // Catálogo de solo lectura (STARTER): sin carrito. Cuentas de cliente: PRO+.
  const showCart = features?.checkout ?? true;
  const showAccount = features?.customerAccounts ?? true;

  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
  };

  return (
    <header className="site-header border-b border-line bg-background/92 backdrop-blur-sm sticky top-0 z-30">
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
          <nav className="flex items-center gap-2 text-sm">
            {LEFT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-active={isLinkActive(l.href)}
                className="editorial-nav-link text-foreground/85 font-medium"
              >
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex justify-center">
            <Logo size={22} brand={brand} />
          </div>
          <div className="flex items-center justify-end gap-3 text-sm">
            {RIGHT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-active={isLinkActive(l.href)}
                className="editorial-nav-link text-foreground/85 font-medium"
              >
                <span>{l.label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              className="p-1.5 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              <Search className="size-[18px]" />
            </button>
            {showAccount && (
              <Link
                href="/cuenta"
                aria-label="Cuenta"
                data-active={isLinkActive("/cuenta")}
                className="editorial-nav-link p-1.5 text-foreground/80"
              >
                <User className="size-[18px]" />
              </Link>
            )}
            {showCart && (
              <button
                onClick={open}
                aria-label={`Carrito (${count})`}
                className="editorial-nav-link relative flex items-center gap-1.5 text-foreground/80 cursor-pointer"
              >
                <ShoppingBag className="size-[18px]" />
                {count > 0 && (
                  <span className="text-xs font-semibold tabular-nums">{count}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda desplegable */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="mt-4 pt-3 border-t border-border flex items-center gap-3"
          >
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar café por origen, nota de sabor (cacao, jazmín, panela) o accesorio…"
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="editorial-select-row px-3 py-1 text-xs font-medium border border-foreground"
              data-active="true"
            >
              <span>Buscar</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </form>
        )}
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
          <nav className="px-4 py-6 divide-y divide-border">
            {MOBILE_LINKS.map((l, idx) => (
              <Link
                key={l.href}
                href={l.href}
                data-active={isLinkActive(l.href)}
                onClick={() => setMenuOpen(false)}
                className="editorial-select-row flex items-center justify-between px-3 py-3 text-base text-foreground"
              >
                <span>{l.label}</span>
                <span className="text-xs tabular-nums opacity-60">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </Link>
            ))}
            {showAccount && (
              <Link
                href="/cuenta"
                data-active={isLinkActive("/cuenta")}
                onClick={() => setMenuOpen(false)}
                className="editorial-select-row mt-6 flex items-center justify-between px-3 py-3 text-base font-medium border border-border"
              >
                <span>
                  <User className="size-4 inline mr-2" />
                  Mi cuenta
                </span>
                <span className="text-xs uppercase tracking-wider opacity-70">Perfil</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
