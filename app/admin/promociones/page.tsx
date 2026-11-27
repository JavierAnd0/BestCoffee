import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { listDiscountCodes } from "@/lib/data/admin";
import { PromoCreateDialog } from "./promo-create-dialog";
import { PromoRowActions } from "./promo-row-actions";

export const metadata: Metadata = { title: "Promociones · Admin" };

const TYPE_LABEL: Record<string, string> = {
  PERCENT: "Porcentaje",
  FIXED: "Monto fijo",
};

export default async function AdminPromosPage() {
  const discounts = await listDiscountCodes();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description={`${discounts.filter((d) => d.active).length} activas · ${discounts.length} totales`}
        actions={<PromoCreateDialog />}
      />

      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="admin-th bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Aplica a</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium sr-only">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium bg-muted px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{TYPE_LABEL[d.type] ?? d.type}</td>
                <td className="px-4 py-3 font-medium">{d.value}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.appliesTo}</td>
                <td className="px-4 py-3 tabular-nums">
                  {d.usesCount}
                  {d.usesLimit != null && (
                    <span className="text-muted-foreground"> / {d.usesLimit}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.expiresAt}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      d.active
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {d.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <PromoRowActions id={d.id} code={d.code} active={d.active} />
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Aún no hay códigos promocionales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
