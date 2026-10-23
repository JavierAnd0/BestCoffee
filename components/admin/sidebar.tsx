"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  FolderOpen,
  ClipboardList,
  RefreshCw,
  Users,
  FileText,
  TicketPercent,
  Star,
  Settings,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/storefront/logo";
import { stopImpersonationAction } from "@/lib/actions/operator-auth";
import { OperatorLogoutButton } from "./operator-logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Coffee },
  { href: "/admin/colecciones", label: "Colecciones", icon: FolderOpen },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: RefreshCw },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/logistica", label: "Logística", icon: Truck },
  { href: "/admin/contenido", label: "Contenido", icon: FileText },
  { href: "/admin/promociones", label: "Promociones", icon: TicketPercent },
  { href: "/admin/resenas", label: "Reseñas", icon: Star },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  { href: "/admin/auditoria", label: "Auditoría", icon: ShieldCheck },
];

export function AdminSidebar({
  operator,
}: {
  operator: {
    name: string;
    email: string;
    role: string;
    impersonatingTenant?: string | null;
  };
}) {
  const pathname = usePathname();
  const initials =
    operator.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "OP";

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Logo size={18} href="/admin" />
        <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Admin
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors " +
                (active
                  ? "bg-muted text-foreground font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground")
              }
            >
              <Icon className="size-4" />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {operator.impersonatingTenant && (
          <form action={stopImpersonationAction}>
            <button
              type="submit"
              className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-500/20 transition-colors"
            >
              Salir de impersonación →
            </button>
          </form>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="size-8 rounded-full bg-foreground/10 grid place-items-center text-xs font-semibold">
            {initials}
          </span>
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-medium truncate">{operator.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {operator.role}
            </div>
          </div>
          <OperatorLogoutButton />
        </div>
      </div>
    </aside>
  );
}
