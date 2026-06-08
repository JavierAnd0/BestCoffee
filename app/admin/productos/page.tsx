import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { PRODUCTS } from "@/lib/mocks/products";
import { formatCop } from "@/lib/format";

export const metadata: Metadata = { title: "Productos · Admin" };

const TYPE_LABEL = {
  BLEND: "Mezcla",
  SINGLE_ORIGIN: "Origen único",
  DECAF: "Descafeinado",
} as const;

const BADGE_LABEL = {
  BESTSELLER: "Más vendido",
  NEW: "Nuevo",
  LIMITED: "Limitado",
  SUBSCRIBER_ONLY: "Suscriptores",
  SEASONAL: "Temporada",
} as const;

export default function ProductsListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description={`${PRODUCTS.length} productos · ${PRODUCTS.filter((p) => p.status === "ACTIVE").length} activos`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Buscar productos"
                className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-64 outline-none focus-visible:border-foreground/40"
              />
            </div>
            <Button render={<Link href="/admin/productos/nuevo"><Plus className="size-4" />Nuevo producto</Link>} />
          </>
        }
      />

      <div className="flex gap-2 text-xs">
        {["Todos", "Activos", "Borrador", "Archivados"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-md px-3 py-1.5 transition-colors " +
              (i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Tueste</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Precio desde</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PRODUCTS.map((p) => {
              const cheapest = p.variants.reduce(
                (a, b) => (a.priceOneTimeCents <= b.priceOneTimeCents ? a : b),
                p.variants[0],
              );
              const totalStock = p.variants.reduce((n, v) => n + v.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="flex items-center gap-3 hover:underline underline-offset-2"
                    >
                      <span className="size-10 rounded-md bg-muted" aria-hidden />
                      <span className="font-medium">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{TYPE_LABEL[p.type]}</td>
                  <td className="px-4 py-3 tabular-nums">{p.roastLevel}/9</td>
                  <td className="px-4 py-3 tabular-nums">{totalStock}</td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {formatCop(cheapest.priceOneTimeCents)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-normal">
                      {p.status === "ACTIVE" ? "Activo" : p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.badges.map((b) => (
                        <Badge key={b} variant="secondary" className="font-normal text-[10px]">
                          {BADGE_LABEL[b]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
