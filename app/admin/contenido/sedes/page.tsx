import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminLocations } from "@/lib/data/admin-content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { deleteLocationAction } from "@/lib/actions/admin-content";
import { LoadError, SectionHeader, locationHoursText } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";
import { EditPanel } from "../_components/edit-panel";
import { LocationForm } from "./location-form";

export const metadata: Metadata = { title: "Sedes · Contenido · Admin" };

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; nuevo?: string }>;
}) {
  const [res, tenant, { editar, nuevo }] = await Promise.all([
    listAdminLocations(),
    getCurrentTenant().catch(() => null),
    searchParams,
  ]);
  // ?editar=<id> o ?nuevo=1 abren el formulario en un panel sobre la lista.
  const editing = res.ok ? res.data.find((l) => l.id === editar) : undefined;
  const creating = nuevo !== undefined && !editing;
  const pageOn = tenant?.branding.pages.tiendas ?? true;
  return (
    <div>
      <SectionHeader
        title="Sedes"
        description="Tiendas físicas que aparecen en /tiendas con su dirección, horario y mapa."
        actions={<Button render={<Link href="/admin/contenido/sedes?nuevo=1" scroll={false}><Plus className="size-4" />Nueva sede</Link>} />}
      />
      {!pageOn && (
        <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          La página pública de sedes no está activa en tu tienda. Lo que cargues aquí se mostrará cuando la plataforma la active.
        </p>
      )}
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : res.data.length === 0 ? (
        <EmptyState title="Aún no hay sedes" description="Agrega tu primera tienda física." />
      ) : (
        <div className="rounded-lg border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-th bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">Sede</th>
                <th className="px-4 py-3 font-medium">Dirección</th>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {res.data.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/contenido/sedes?editar=${l.id}`} scroll={false} className="font-medium hover:underline underline-offset-2">
                      {l.name}
                    </Link>
                    {l.phone && <div className="text-xs text-muted-foreground mt-0.5">{l.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.address}, {l.city}
                    {(l.lat === null || l.lng === null) && (
                      <div className="text-xs text-amber-800 mt-0.5">Sin coordenadas: el mapa no puede ubicarla.</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{locationHoursText(l.hours) || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <ActionButton
                        label="Borrar"
                        variant="destructive"
                        confirmText={`¿Borrar la sede "${l.name}"? No se puede deshacer.`}
                        action={deleteLocationAction.bind(null, l.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <EditPanel
          title={editing ? editing.name : "Nueva sede"}
          description={editing ? "Los cambios se ven en /tiendas al guardar." : "Una tienda física con su dirección, horario y mapa."}
          closeHref="/admin/contenido/sedes"
        >
          <LocationForm key={editing?.id ?? "nueva"} location={editing} inPanel />
        </EditPanel>
      )}
    </div>
  );
}
