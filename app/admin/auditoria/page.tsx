import type { Metadata } from "next";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { ADMIN_AUDIT } from "@/lib/mocks/admin";

export const metadata: Metadata = { title: "Auditoría · Admin" };

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de auditoría"
        description="Toda acción que afecta productos, precios o configuración queda registrada."
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Buscar por usuario, entidad o ID"
                className="rounded-md border border-input bg-background pl-8 pr-3 h-9 text-sm w-72 outline-none focus-visible:border-foreground/40"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="flex gap-2 text-xs">
        {["Todas", "Productos", "Pedidos", "Suscripciones", "Contenido", "Sistema"].map((t, i) => (
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
              <th className="px-4 py-3 font-medium">Cuándo</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Acción</th>
              <th className="px-4 py-3 font-medium">Entidad</th>
              <th className="px-4 py-3 font-medium">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ADMIN_AUDIT.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {e.at}
                </td>
                <td className="px-4 py-3 font-medium">{e.user}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-normal">
                    {e.entity}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {e.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Los registros se conservan por 24 meses. Pasa a Tier Pro para extender a 5
        años y exportes automáticos diarios.
      </p>
    </div>
  );
}
