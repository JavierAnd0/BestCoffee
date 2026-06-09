import type { Metadata } from "next";
import { Search, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminCustomers } from "@/lib/data/admin";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Clientes · Admin" };

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes registrados`}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder="Buscar por nombre o email"
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-72 outline-none focus-visible:border-foreground/40"
            />
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Pedidos</th>
              <th className="px-4 py-3 font-medium">Suscripciones</th>
              <th className="px-4 py-3 font-medium text-right">Valor total</th>
              <th className="px-4 py-3 font-medium">Miembro desde</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="size-9 rounded-full bg-foreground/10 grid place-items-center text-xs font-semibold">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{c.ordersCount}</td>
                <td className="px-4 py-3">
                  {c.activeSubsCount > 0 ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                      {c.activeSubsCount} activas
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatCop(c.totalSpentCents)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.joinedAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Enviar email"
                  >
                    <Mail className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
