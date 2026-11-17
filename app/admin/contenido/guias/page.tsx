import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminBrewGuides } from "@/lib/data/admin-content";
import { deleteBrewGuideAction } from "@/lib/actions/admin-content";
import { LoadError, SectionHeader } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";

export const metadata: Metadata = { title: "Guías · Contenido · Admin" };

export default async function AdminGuidesPage() {
  const res = await listAdminBrewGuides();
  return (
    <div>
      <SectionHeader
        title="Guías de preparación"
        description="Recetas paso a paso que aparecen en /guias."
        actions={<Button render={<Link href="/admin/contenido/guias/nuevo"><Plus className="size-4" />Nueva guía</Link>} />}
      />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : res.data.length === 0 ? (
        <EmptyState title="Aún no hay guías" description="Crea la primera: se publica en cuanto la guardas." />
      ) : (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">Guía</th>
                <th className="px-4 py-3 font-medium">Dificultad</th>
                <th className="px-4 py-3 font-medium">Pasos</th>
                <th className="px-4 py-3 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {res.data.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/contenido/guias/${g.id}`} className="font-medium hover:underline underline-offset-2">
                      {g.method || g.title}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">/guias/{g.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{g.difficulty}</td>
                  <td className="px-4 py-3 tabular-nums">{g.steps.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" render={<Link href={`/guias/${g.slug}`} target="_blank">Ver</Link>} />
                      <ActionButton
                        label="Borrar"
                        variant="destructive"
                        confirmText={`¿Borrar la guía "${g.method || g.title}"? No se puede deshacer.`}
                        action={deleteBrewGuideAction.bind(null, g.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
