import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminBlogPosts, type AdminBlogPost, type BlogPostStatus } from "@/lib/data/admin-content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { deleteBlogPostAction, setBlogPostPublishedAction } from "@/lib/actions/admin-content";
import { remoteImage } from "@/lib/remote-image";
import { LoadError, fmtDate } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";

export const metadata: Metadata = { title: "Blog · Contenido · Admin" };

const STATUS: Record<BlogPostStatus, { label: string; dot: string; text: string }> = {
  PUBLISHED: { label: "Publicado", dot: "bg-emerald-600", text: "text-emerald-800" },
  SCHEDULED: { label: "Programado", dot: "bg-amber-500", text: "text-amber-800" },
  DRAFT: { label: "Borrador", dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

const FILTERS: { key?: BlogPostStatus; label: string; param?: string }[] = [
  { label: "Todos" },
  { key: "PUBLISHED", label: "Publicados", param: "publicados" },
  { key: "SCHEDULED", label: "Programados", param: "programados" },
  { key: "DRAFT", label: "Borradores", param: "borradores" },
];

/** Línea de fecha según el estado: lo que el dueño necesita saber de un vistazo. */
function dateLine(p: AdminBlogPost): string {
  if (p.status === "PUBLISHED") return `Publicado el ${fmtDate(p.publishedAt)}`;
  if (p.status === "SCHEDULED") return `Sale el ${fmtDate(p.publishedAt)}`;
  return `Editado el ${fmtDate(p.updatedAt)}`;
}

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  const [res, { estado }] = await Promise.all([listAdminBlogPosts(), searchParams]);
  const active = FILTERS.find((f) => f.param === estado) ?? FILTERS[0];

  const newButton = (
    <Button
      render={
        <Link href="/admin/contenido/blog/nuevo">
          <Plus className="size-4" />
          Escribir artículo
        </Link>
      }
    />
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Blog</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Recetas, historias de tus fincas y guías para tus clientes. Solo los publicados se ven en tu tienda.
          </p>
        </div>
        {res.ok && res.data.length > 0 && newButton}
      </div>

      {!res.ok ? (
        <LoadError error={res.error} />
      ) : res.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-background px-6 py-16 text-center">
          <FileText className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">Tu blog está esperando su primer artículo</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Cuenta cómo preparas tu café, de dónde viene o qué lo hace especial. Puedes guardarlo como borrador y
            publicarlo cuando esté listo.
          </p>
          <div className="mt-6 flex justify-center">{newButton}</div>
        </div>
      ) : (
        <>
          <nav aria-label="Filtrar artículos" className="mb-4 flex flex-wrap gap-1 text-sm">
            {FILTERS.map((f) => {
              const count = f.key ? res.data.filter((p) => p.status === f.key).length : res.data.length;
              const current = f === active;
              return (
                <Link
                  key={f.label}
                  href={f.param ? `/admin/contenido/blog?estado=${f.param}` : "/admin/contenido/blog"}
                  aria-current={current ? "page" : undefined}
                  className={
                    "rounded-md px-3 py-1.5 transition-colors " +
                    (current ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {f.label} <span className="tabular-nums opacity-60">{count}</span>
                </Link>
              );
            })}
          </nav>

          <ul className="divide-y divide-border rounded-lg border border-border bg-background">
            {res.data
              .filter((p) => !active.key || p.status === active.key)
              .map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
            {active.key && !res.data.some((p) => p.status === active.key) && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No hay artículos {active.label.toLowerCase()}.
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function PostRow({ post: p }: { post: AdminBlogPost }) {
  const st = STATUS[p.status];
  const cover = remoteImage(p.coverUrl);
  return (
    <li className="group relative flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/30 sm:gap-5 sm:px-5">
      <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-28">
        {cover ? (
          <Image src={cover.src} unoptimized={cover.unoptimized} alt="" fill sizes="112px" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground/60">
            <FileText className="size-5" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/contenido/blog/${p.id}`}
          className="font-display text-lg font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-[var(--accent)]"
        >
          {p.title}
        </Link>
        {p.excerpt && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{p.excerpt}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
          <span className={"inline-flex items-center gap-1.5 font-medium " + st.text}>
            <span className={"size-1.5 rounded-full " + st.dot} aria-hidden />
            {st.label}
          </span>
          <span className="text-muted-foreground">{dateLine(p)}</span>
        </p>
      </div>

      <div className="relative z-10 hidden shrink-0 items-center gap-1 sm:flex">
        {p.status === "PUBLISHED" && (
          <Button
            size="sm"
            variant="ghost"
            render={
              <Link href={`/blog/${p.slug}`} target="_blank" aria-label={`Ver "${p.title}" en la tienda`}>
                <ExternalLink className="size-3.5" />
                Ver
              </Link>
            }
          />
        )}
        <ActionButton
          label={p.status === "DRAFT" ? "Publicar" : "Pasar a borrador"}
          variant="ghost"
          action={setBlogPostPublishedAction.bind(null, p.id, p.status === "DRAFT")}
        />
        <ActionButton
          label="Borrar"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          confirmText={`¿Borrar "${p.title}"? No se puede deshacer. Si solo quieres quitarlo de la tienda, usa "Pasar a borrador".`}
          action={deleteBlogPostAction.bind(null, p.id)}
        />
      </div>
    </li>
  );
}
