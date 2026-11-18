import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminProducts } from "@/lib/data/admin";
import { formatCop } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Productos · Admin" };

// Orden de las secciones de la lista: primero los cafés, al final los accesorios.
const TYPE_GROUPS: { type: Product["type"]; title: string }[] = [
  { type: "SINGLE_ORIGIN", title: "Origen único" },
  { type: "BLEND", title: "Mezclas" },
  { type: "DECAF", title: "Descafeinados" },
  { type: "ACCESSORY", title: "Accesorios" },
];

const BADGE_LABEL: Record<string, string> = {
  BESTSELLER: "Más vendido",
  NEW: "Nuevo",
  LIMITED: "Limitado",
  SUBSCRIBER_ONLY: "Suscriptores",
  SEASONAL: "Temporada",
};

const STATUS_LABEL: Record<Product["status"], string> = {
  ACTIVE: "Activo",
  DRAFT: "Borrador",
  ARCHIVED: "Archivado",
};

const STATUS_TONE: Record<Product["status"], string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  DRAFT: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

/** Etiqueta legible: las conocidas se traducen; las libres ("PRECISIÓN") pasan a "Precisión". */
function badgeLabel(badge: string): string {
  const known = BADGE_LABEL[badge];
  if (known) return known;
  const lower = badge.trim().toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

const FILTERS: { label: string; value?: Product["status"] }[] = [
  { label: "Todos" },
  { label: "Activos", value: "ACTIVE" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Archivados", value: "ARCHIVED" },
];

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ status, q }, products] = await Promise.all([
    searchParams,
    listAdminProducts(),
  ]);

  const query = q?.trim().toLowerCase() ?? "";
  const activeStatus = FILTERS.some((f) => f.value === status)
    ? (status as Product["status"])
    : undefined;

  const filtered = products.filter((p) => {
    if (activeStatus && p.status !== activeStatus) return false;
    if (query) {
      return (
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description={`${products.length} productos · ${products.filter((p) => p.status === "ACTIVE").length} activos`}
        actions={
          <>
            <form method="GET" className="relative">
              {activeStatus && (
                <input type="hidden" name="status" value={activeStatus} />
              )}
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar productos"
                className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-64 outline-none focus-visible:border-foreground/40"
              />
            </form>
            <Button render={<Link href="/admin/productos/nuevo"><Plus className="size-4" />Nuevo producto</Link>} />
          </>
        }
      />

      <div className="flex gap-2 text-xs">
        {FILTERS.map((f) => {
          const isCurrent = f.value === activeStatus;
          const params = new URLSearchParams();
          if (f.value) params.set("status", f.value);
          if (q) params.set("q", q);
          const href = params.toString()
            ? `/admin/productos?${params.toString()}`
            : "/admin/productos";
          return (
            <Link
              key={f.label}
              href={href}
              className={
                "rounded-md px-3 py-1.5 transition-colors " +
                (isCurrent
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Tueste</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Precio desde</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Badges</th>
            </tr>
          </thead>
          {TYPE_GROUPS.map((g) => {
            const items = filtered.filter((p) => p.type === g.type);
            if (items.length === 0) return null;
            return (
          <tbody key={g.type} className="divide-y divide-border border-b border-border last:border-b-0">
            <tr className="bg-muted/40">
              <th colSpan={6} scope="rowgroup" className="px-4 py-2.5 text-left">
                <span className="font-display text-base font-semibold tracking-tight">{g.title}</span>
                <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                  {items.length} {items.length === 1 ? "producto" : "productos"}
                </span>
              </th>
            </tr>
            {items.map((p) => {
              const cheapest =
                p.variants.length > 0
                  ? p.variants.reduce(
                      (a, b) => (a.priceOneTimeCents <= b.priceOneTimeCents ? a : b),
                      p.variants[0],
                    )
                  : undefined;
              const totalStock = p.variants.reduce((n, v) => n + v.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="flex items-center gap-3 hover:underline underline-offset-2"
                    >
                      {p.images[0] ? (
                        <Image
                          src={p.images[0].url}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md bg-muted object-cover"
                        />
                      ) : (
                        <span className="size-10 shrink-0 rounded-md bg-muted" aria-hidden />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {p.type === "ACCESSORY" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      `${p.roastLevel}/9`
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{totalStock}</td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {cheapest ? formatCop(cheapest.priceOneTimeCents) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={"font-normal " + (STATUS_TONE[p.status] ?? STATUS_TONE.ARCHIVED)}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.badges.map((b) => (
                        <Badge key={b} variant="secondary" className="font-normal text-[10px]">
                          {badgeLabel(b)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
            );
          })}
          {filtered.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No se encontraron productos.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
