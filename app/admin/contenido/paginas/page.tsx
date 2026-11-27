import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listAdminPages } from "@/lib/data/admin-content";
import { setEditorialPageActiveAction } from "@/lib/actions/admin-content";
import { CONTENT_PAGES } from "@/lib/editorial-pages";
import type { AdminEditorialPage } from "@/lib/editorial-pages";
import { LoadError, SectionHeader, fmtDate } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";

export const metadata: Metadata = { title: "Páginas · Contenido · Admin" };

const TOGGLES = [
  {
    slug: "tiendas",
    label: "Sedes físicas",
    path: "/tiendas",
    help: "Muestra las sedes de la pestaña Sedes, con mapa y horarios.",
  },
] as const;

function Status({ page }: { page: AdminEditorialPage | undefined }) {
  if (page?.live) {
    return <span className="text-xs font-medium text-emerald-700">Visible en la tienda</span>;
  }
  if (page?.active) {
    // Activada (p. ej. desde la plataforma) pero sin contenido: la ruta no existe.
    return <span className="text-xs font-medium text-amber-700">Activada, falta el contenido</span>;
  }
  if (page?.kind === "content" && !page.content) {
    return <span className="text-xs text-muted-foreground">Sin escribir</span>;
  }
  return <span className="text-xs text-muted-foreground">Desactivada</span>;
}

export default async function AdminPagesPage() {
  const res = await listAdminPages();
  const bySlug = new Map((res.ok ? res.data : []).map((p) => [p.slug, p]));

  return (
    <div>
      <SectionHeader
        title="Páginas"
        description="Páginas de marca de la tienda. Escribe su contenido y actívalas: desactivadas, la dirección no existe y no aparecen en menús ni en el mapa del sitio."
      />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : (
        <div className="rounded-lg border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-th bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">Página</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Editada</th>
                <th className="px-4 py-3 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CONTENT_PAGES.map((p) => {
                const page = bySlug.get(p.slug);
                const hasContent = Boolean(page?.content);
                return (
                  <tr key={p.slug} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/contenido/paginas/${p.slug}`} className="font-medium hover:underline underline-offset-2">
                        {p.label}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{p.path}</span> · {p.help}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Status page={page} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {fmtDate(page?.content?.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {page?.live && (
                          <Button size="sm" variant="ghost" render={<Link href={p.path} target="_blank">Ver</Link>} />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/admin/contenido/paginas/${p.slug}`}>{hasContent ? "Editar" : "Escribir"}</Link>}
                        />
                        {hasContent && (
                          <ActionButton
                            label={page?.active ? "Desactivar" : "Activar"}
                            variant={page?.active ? "ghost" : "outline"}
                            confirmText={
                              page?.active
                                ? `¿Desactivar "${p.label}"? La dirección ${p.path} dejará de existir hasta que la actives de nuevo.`
                                : undefined
                            }
                            action={setEditorialPageActiveAction.bind(null, p.slug, !page?.active)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {TOGGLES.map((p) => {
                const page = bySlug.get(p.slug);
                return (
                  <tr key={p.slug} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium">{p.label}</span>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{p.path}</span> · {p.help}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Status page={page} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" />
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {page?.live && (
                          <Button size="sm" variant="ghost" render={<Link href={p.path} target="_blank">Ver</Link>} />
                        )}
                        <Button size="sm" variant="outline" render={<Link href="/admin/contenido/sedes">Sedes</Link>} />
                        <ActionButton
                          label={page?.active ? "Desactivar" : "Activar"}
                          variant={page?.active ? "ghost" : "outline"}
                          action={setEditorialPageActiveAction.bind(null, p.slug, !page?.active)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
