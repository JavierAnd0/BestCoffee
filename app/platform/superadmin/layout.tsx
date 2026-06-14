import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, LogOut } from "lucide-react";
import { platformFetch } from "@/lib/api/platform";

const NAV = [
  { href: "/platform/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/platform/superadmin/tenants", label: "Tenants", icon: Store },
];

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isPlatformOwner = false;
  try {
    const me = await platformFetch<{ isPlatformOwner?: boolean }>("/v1/auth/me");
    isPlatformOwner = me.isPlatformOwner === true;
  } catch {
    isPlatformOwner = false;
  }

  if (!isPlatformOwner) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 border-r border-border bg-background flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <p className="font-semibold text-sm">BestCoffee</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
            Superadmin
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            href="/login"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
            Salir
          </Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0 bg-muted/30">
        <main className="max-w-6xl mx-auto p-8">{children}</main>
      </div>
    </div>
  );
}
