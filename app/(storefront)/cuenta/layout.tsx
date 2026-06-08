import Link from "next/link";
import { LogOut } from "lucide-react";
import { MOCK_CUSTOMER } from "@/lib/mocks/account";

const NAV = [
  { href: "/cuenta", label: "Resumen" },
  { href: "/cuenta/pedidos", label: "Pedidos" },
  { href: "/cuenta/suscripciones", label: "Suscripciones" },
  { href: "/cuenta/direcciones", label: "Direcciones" },
  { href: "/cuenta/datos", label: "Mis datos" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[240px_1fr] gap-12">
      <aside className="space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-border">
          <span className="size-11 rounded-full bg-foreground/10 grid place-items-center font-display text-lg font-semibold">
            {MOCK_CUSTOMER.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <div className="font-medium truncate">{MOCK_CUSTOMER.name}</div>
            <div className="text-xs text-muted-foreground">
              Miembro desde {MOCK_CUSTOMER.memberSince}
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
          <button className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left">
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
