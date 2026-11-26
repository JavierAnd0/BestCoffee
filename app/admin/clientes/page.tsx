import type { Metadata } from "next";
import Link from "next/link";
import { Search, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminCustomers } from "@/lib/data/admin";
import { formatCop } from "@/lib/format";
import { Tooltip } from "@/components/ui/tooltip";

export const metadata: Metadata = { title: "Clientes · Admin" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (Array.isArray(rawQ) ? rawQ[0] : rawQ)?.trim() ?? "";
  const customers = await listAdminCustomers(q);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={
          q
            ? `${customers.length} ${customers.length === 1 ? "resultado" : "resultados"} para “${q}”`
            : `${customers.length} clientes registrados`
        }
        actions={
          // GET simple: la búsqueda queda en la URL (?q=) y funciona sin JavaScript.
          <form action="/admin/clientes" role="search" className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o email"
              aria-label="Buscar clientes por nombre o email"
              className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-72 outline-none focus-visible:border-foreground/40"
            />
          </form>
        }
      />

      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th bg-muted/30 border-b border-border">
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
                  <Tooltip content={`Escribir a ${c.email}`}>
                    {/* Abre el programa de correo del operador con el destinatario ya puesto. */}
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Escribir a ${c.name}`}
                    >
                      <Mail className="size-4" />
                    </a>
                  </Tooltip>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {q ? (
                    <>
                      Ningún cliente coincide con “{q}”.{" "}
                      <Link href="/admin/clientes" className="font-medium text-foreground underline underline-offset-4">
                        Ver todos
                      </Link>
                    </>
                  ) : (
                    "Todavía no hay clientes registrados."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
