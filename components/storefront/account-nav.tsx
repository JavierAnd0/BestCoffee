"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/cuenta", label: "Resumen", code: "01" },
  { href: "/cuenta/pedidos", label: "Pedidos", code: "02" },
  { href: "/cuenta/suscripciones", label: "Suscripciones", code: "03" },
  { href: "/cuenta/direcciones", label: "Direcciones", code: "04" },
  { href: "/cuenta/datos", label: "Mis datos", code: "05" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <div className="divide-y divide-border border-y border-border">
      {NAV.map((n) => {
        const isActive =
          n.href === "/cuenta"
            ? pathname === "/cuenta"
            : pathname === n.href || pathname?.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            data-active={isActive}
            className="editorial-select-row flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground/85"
          >
            <span>{n.label}</span>
            <span className="text-xs tabular-nums opacity-70">{n.code}</span>
          </Link>
        );
      })}
    </div>
  );
}

