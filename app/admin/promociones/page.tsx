import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { ADMIN_DISCOUNTS } from "@/lib/mocks/admin";

export const metadata: Metadata = { title: "Promociones · Admin" };

const TYPE_LABEL = {
  PERCENT: "Porcentaje",
  FIXED: "Monto fijo",
  FREE_SHIPPING: "Envío gratis",
} as const;

export default function AdminPromosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description={`${ADMIN_DISCOUNTS.filter((d) => d.active).length} activas · ${ADMIN_DISCOUNTS.length} totales`}
        actions={
          <Button>
            <Plus className="size-4" />
            Nuevo código
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Aplica a</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ADMIN_DISCOUNTS.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium bg-muted px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{TYPE_LABEL[d.type]}</td>
                <td className="px-4 py-3 font-medium">{d.value}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.appliesTo}</td>
                <td className="px-4 py-3 tabular-nums">
                  {d.usesCount}
                  {d.usesLimit && (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
