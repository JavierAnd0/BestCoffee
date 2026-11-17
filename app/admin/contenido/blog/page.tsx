import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminBlogPosts, type BlogPostStatus } from "@/lib/data/admin-content";
import { getCurrentTenant } from "@/lib/data/tenant";
import {
  deleteBlogPostAction,
  setBlogPostPublishedAction,
} from "@/lib/actions/admin-content";
import { SectionHeader, LoadError, fmtDate } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";

export const metadata: Metadata = { title: "Blog · Contenido · Admin" };

const STATUS: Record<BlogPostStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "Publicado", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  SCHEDULED: { label: "Programado", className: "bg-amber-500/10 text-amber-800 border-amber-500/20" },
  DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground border-border" },
};

export default async function AdminBlogPage() {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  const res = await listAdminBlogPosts();

  return (
    <div>
      <SectionHeader
        title="Blog"
        description="Artículos de tu tienda. Los borradores no se ven en la tienda pública."
        actions={<Button render={<Link href="/admin/contenido/blog/nuevo"><Plus className="size-4" />Nuevo artículo</Link>} />}
      />
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : res.data.length === 0 ? (
        <EmptyState
          title="Aún no hay artículos"
          description="Escribe el primero: aparecerá en /blog en cuanto lo publiques."
        />
      ) : (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Publicación</th>
                <th className="px-4 py-3 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {res.data.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/contenido/blog/${p.id}`} className="font-medium hover:underline underline-offset-2">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">/blog/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS[p.status].className}>
                      {STATUS[p.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {p.status === "PUBLISHED" && (
                        <Button size="sm" variant="ghost" render={<Link href={`/blog/${p.slug}`} target="_blank">Ver</Link>} />
                      )}
                      <ActionButton
                        label={p.status === "DRAFT" ? "Publicar" : "Pasar a borrador"}
                        action={setBlogPostPublishedAction.bind(null, p.id, p.status === "DRAFT")}
                      />
                      <ActionButton
                        label="Borrar"
                        variant="destructive"
                        confirmText={`¿Borrar "${p.title}"? No se puede deshacer.`}
                        action={deleteBlogPostAction.bind(null, p.id)}
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
