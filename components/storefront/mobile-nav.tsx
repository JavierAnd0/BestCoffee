"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Coffee, User, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";

const ITEMS = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/catalogo", label: "Catálogo", icon: Search },
  { href: "/quiz", label: "Quiz", icon: Coffee, fab: true },
  { href: "/cuenta", label: "Cuenta", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { count, open } = useCart();

  // Hide on admin and checkout flows where it'd be in the way.
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur border-t border-border safe-area-inset"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((i) => {
          const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
          const Icon = i.icon;
          if (i.fab) {
            return (
              <Link
                key={i.href}
                href={i.href}
                className="relative flex flex-col items-center justify-center py-2 -mt-5"
              >
                <span className="size-12 rounded-full bg-foreground text-background grid place-items-center shadow-lg">
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <span className="text-[10px] mt-1 text-muted-foreground">{i.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors " +
                (active ? "text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="size-5" strokeWidth={1.6} />
              <span className="text-[10px]">{i.label}</span>
            </Link>
          );
        })}
        <button
          onClick={open}
          className="flex flex-col items-center justify-center py-2.5 gap-0.5 text-muted-foreground hover:text-foreground transition-colors relative"
          aria-label={`Carrito (${count})`}
        >
          <ShoppingBag className="size-5" strokeWidth={1.6} />
          <span className="text-[10px]">Carrito</span>
          {count > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-18px)] size-4 rounded-full bg-accent text-accent-foreground text-[9px] font-semibold grid place-items-center tabular-nums">
              {count}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
