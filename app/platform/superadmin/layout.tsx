import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, KeyRound } from "lucide-react";
import { platformFetch } from "@/lib/api/platform";
import { OperatorLogoutButton } from "@/components/admin/operator-logout-button";

const SECURITY_PATH = "/platform/superadmin/seguridad";

const NAV = [
  { href: "/platform/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/platform/superadmin/tenants", label: "Tenants", icon: Store },
  { href: "/platform/superadmin/seguridad", label: "Seguridad", icon: KeyRound },
];

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isPlatformOwner = false;
  let mfaRequired: "setup" | "login" | null = null;
  try {
    const me = await platformFetch<{ isPlatformOwner?: boolean; mfaRequired?: "setup" | "login" | null }>(
      "/v1/auth/me",
    );
    isPlatformOwner = me.isPlatformOwner === true;
    mfaRequired = me.mfaRequired ?? null;
  } catch {
    isPlatformOwner = false;
  }

  if (!isPlatformOwner) redirect("/acceso");
  // La verificación en dos pasos es obligatoria para esta cuenta (la API lo
  // exige igual). Sin activarla, solo se puede usar la página de Seguridad;
  // con ella activa pero una sesión abierta sin código, hay que volver a entrar.
  if (mfaRequired === "login") redirect("/acceso?motivo=2fa");
  const setupOnly = mfaRequired === "setup";
  if (setupOnly) {
    const path = (await headers()).get("x-request-path") ?? "";
    if (!path.startsWith(SECURITY_PATH)) redirect(SECURITY_PATH);
  }
  const nav = setupOnly ? NAV.filter((n) => n.href === SECURITY_PATH) : NAV;

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
          {nav.map(({ href, label, icon: Icon }) => (
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
          <OperatorLogoutButton
            showIcon={true}
            className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
          >
            <span>Salir</span>
          </OperatorLogoutButton>
        </div>
      </aside>
      <div className="flex-1 min-w-0 bg-muted/30">
        <main className="max-w-6xl mx-auto p-8">
          {setupOnly && (
            <p
              role="status"
              className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              Para usar el panel de la plataforma, activa la verificación en dos pasos. Es obligatoria
              para esta cuenta porque controla todas las tiendas.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
