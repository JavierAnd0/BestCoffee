"use client";

import { startTransition, useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, ImagePlus, Loader2, PenLine, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { saveBlogPostAction, type BlogSaveResult } from "@/lib/actions/admin-content";
import { discardContentImageAction } from "@/lib/actions/content-images";
import type { AdminBlogPost, BlogPostStatus } from "@/lib/data/admin-content";
import { remoteImage } from "@/lib/remote-image";
import { ImageUploadField, uploadContentImage } from "@/components/admin/image-upload-field";
import { ArticleBody } from "@/components/storefront/article-body";
import { FieldLabel, inputClass, toLocalInput } from "../_components/fields";
import { RichText } from "./rich-text";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** "Cómo preparar un V60" → "como-preparar-un-v60" (lo mismo que hará el servidor). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

type Draft = { title: string; excerpt: string; body: string; coverUrl: string; savedAt: number };

const draftKey = (id?: string) => `blog-draft:${id ?? "nuevo"}`;

function readDraft(id?: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function clearDraft(id?: string) {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* sin almacenamiento: nada que limpiar */
  }
}

function timeAgo(ms: number, now: number): string {
  const s = Math.round((now - ms) / 1000);
  if (s < 10) return "hace un momento";
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return new Date(ms).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

/**
 * Editor de artículos al estilo de Ghost/Substack: el texto ocupa el centro,
 * lo técnico (dirección, fecha, vista en Google) vive en un panel de ajustes.
 * Guardar no saca del editor; una copia local protege lo escrito si se cierra
 * la pestaña sin guardar.
 */
export function BlogForm({ post, siteHost }: { post?: AdminBlogPost; siteHost: string }) {
  const router = useRouter();
  const [result, dispatch, pending] = useActionState<BlogSaveResult | null, FormData>(saveBlogPostAction, null);

  const [postId, setPostId] = useState(post?.id);
  const [status, setStatus] = useState<BlogPostStatus | null>(post?.status ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [editorSeed, setEditorSeed] = useState({ key: 0, markdown: post?.body ?? "" });
  const [words, setWords] = useState(0);
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [publishedAt, setPublishedAt] = useState(toLocalInput(post?.publishedAt));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [clientError, setClientError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<Draft | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const isLive = status === "PUBLISHED" || status === "SCHEDULED";

  // Reloj para "Guardado hace 2 min" y para saber si una fecha programa el artículo.
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // ── Copia local: si hay una más nueva que lo guardado, se ofrece recuperarla.
  useEffect(() => {
    const d = readDraft(post?.id);
    const serverTime = post?.updatedAt ? new Date(post.updatedAt).getTime() : 0;
    const differs = d && (d.title !== (post?.title ?? "") || d.body.trim() !== (post?.body ?? "").trim() || d.excerpt !== (post?.excerpt ?? ""));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage solo es posible ya montado
    if (d && differs && d.savedAt > serverTime && (d.title || d.body)) setRecovered(d);
  }, [post]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey(postId),
          JSON.stringify({ title, excerpt, body, coverUrl, savedAt: Date.now() } satisfies Draft),
        );
      } catch {
        /* sin almacenamiento: se sigue sin copia local */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [dirty, title, excerpt, body, coverUrl, postId]);

  // ── Imágenes subidas en esta edición: si no se guardan, se borran de Blob.
  const pendingImages = useRef<Set<string>>(new Set());
  const leaving = useRef(false);
  useEffect(() => {
    const pendingSet = pendingImages.current;
    const onPageHide = () => {
      if (!pendingSet.size) return;
      const blob = new Blob([JSON.stringify({ urls: [...pendingSet] })], { type: "application/json" });
      navigator.sendBeacon?.("/api/admin/content-image-discard", blob);
      pendingSet.clear();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      for (const url of pendingSet) void discardContentImageAction(url);
    };
  }, []);

  // Aviso del navegador al salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ── Resultado de guardar: se queda en el editor.
  const lastHandled = useRef<number | null>(null);
  useEffect(() => {
    if (!result?.ok || lastHandled.current === result.at) return;
    lastHandled.current = result.at;
    const { post: saved } = result;
    const wasNew = !postId;
    // Lo subido que sigue en el artículo quedó guardado; ya no es "pendiente".
    pendingImages.current.clear();
    clearDraft(postId);
    clearDraft(saved.id);
    /* eslint-disable react-hooks/set-state-in-effect -- reflejar lo que confirmó el servidor */
    setPostId(saved.id);
    setStatus(saved.status);
    if (saved.slug) setSlug(saved.slug);
    setDirty(false);
    setSavedAt(result.at);
    setClock(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
    if (saved.status === "PUBLISHED") {
      toast({
        title: "Artículo publicado",
        description: "Ya se ve en el blog de tu tienda.",
        action: { label: "Ver en la tienda", onClick: () => window.open(`/blog/${saved.slug}`, "_blank") },
      });
    } else if (saved.status === "SCHEDULED") {
      toast({ title: "Artículo programado", description: "Aparecerá en el blog en la fecha elegida." });
    }
    if (wasNew && saved.id) router.replace(`/admin/contenido/blog/${saved.id}`, { scroll: false });
  }, [result, postId, router]);

  const touch =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
    };

  function save(target: "draft" | "published") {
    setClientError(null);
    if (!title.trim()) return setClientError("Ponle un título al artículo.");
    if (!body.trim()) return setClientError("El artículo está vacío: escribe el texto antes de guardar.");
    if (slug && !SLUG.test(slug)) {
      setSettingsOpen(true);
      return setClientError("La dirección solo admite minúsculas, números y guiones.");
    }
    const fd = new FormData();
    if (postId) fd.set("id", postId);
    fd.set("title", title.trim());
    fd.set("slug", slug);
    fd.set("excerpt", excerpt.trim());
    fd.set("body", body);
    fd.set("coverUrl", coverUrl);
    fd.set("status", target);
    if (target === "published") fd.set("publishedAt", publishedAt);
    // Lo subido que ya no está en el artículo se limpia ahora.
    for (const url of [...pendingImages.current]) {
      if (!body.includes(url) && url !== coverUrl) {
        pendingImages.current.delete(url);
        void discardContentImageAction(url);
      }
    }
    startTransition(() => dispatch(fd));
  }

  // Cmd/Ctrl + S en cualquier parte del editor.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  const quickSave = () => saveRef.current(isLive ? "published" : "draft");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current(isLive ? "published" : "draft");
      }
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLive]);

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    setClientError(null);
    setCoverUploading(true);
    try {
      const url = await uploadContentImage("blog", file);
      pendingImages.current.add(url);
      touch(setCoverUrl)(url);
    } catch (e) {
      setClientError(e instanceof Error ? e.message : "No se pudo subir la portada.");
    } finally {
      setCoverUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  }

  function restoreDraft() {
    if (!recovered) return;
    setTitle(recovered.title);
    setExcerpt(recovered.excerpt);
    setBody(recovered.body);
    setCoverUrl(recovered.coverUrl);
    setEditorSeed((s) => ({ key: s.key + 1, markdown: recovered.body }));
    setDirty(true);
    setRecovered(null);
  }

  const error = clientError ?? (result && !result.ok ? result.error : null);
  const minutes = Math.max(1, Math.round((words + excerpt.split(/\s+/).filter(Boolean).length) / 200));
  const effectiveSlug = slug || slugify(title) || "tu-articulo";
  const futureDate = !!publishedAt && new Date(publishedAt).getTime() > clock;
  const statusLabel = !status ? "Nuevo" : status === "SCHEDULED" ? "Programado" : status === "PUBLISHED" ? "Publicado" : "Borrador";
  const statusTone = status === "PUBLISHED" ? "bg-emerald-600" : status === "SCHEDULED" ? "bg-amber-500" : "bg-muted-foreground/50";
  const cover = remoteImage(coverUrl);
  const saveState = pending
    ? "Guardando…"
    : dirty
      ? "Cambios sin guardar"
      : savedAt
        ? `Guardado ${timeAgo(savedAt, clock)}`
        : null;

  return (
    <div className="-mt-2">
      {/* ── Barra superior ── */}
      <div className="sticky top-0 z-30 -mx-8 flex h-14 items-center gap-3 border-b border-border bg-background px-8">
        <Link
          href="/admin/contenido/blog"
          onClick={() => (leaving.current = !dirty)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Artículos</span>
        </Link>
        <span className="h-5 w-px bg-border" aria-hidden />
        <span className="inline-flex items-center gap-2 text-sm">
          <span className={"size-1.5 rounded-full " + statusTone} aria-hidden />
          <span className="font-medium">{statusLabel}</span>
        </span>
        <span className="hidden min-w-0 truncate whitespace-nowrap text-xs text-muted-foreground tabular-nums xl:inline" aria-live="polite">
          {words.toLocaleString("es-CO")} palabras · {minutes} min de lectura
          {saveState && (
            <>
              {" · "}
              <span className={dirty && !pending ? "text-amber-800" : ""}>{saveState}</span>
            </>
          )}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            title="Ver cómo queda en la tienda"
          >
            {preview ? <PenLine className="size-4" /> : <Eye className="size-4" />}
            <span className="hidden sm:inline">{preview ? "Seguir editando" : "Vista previa"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            aria-controls="post-settings"
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </Button>
          {isLive ? (
            <Button type="button" size="sm" disabled={pending || !dirty} onClick={() => save("published")} title="⌘S">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : !dirty && <Check className="size-3.5" />}
              {dirty ? "Actualizar" : "Al día"}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => save("draft")} title="⌘S">
                Guardar borrador
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={() => save("published")}>
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                {futureDate ? "Programar" : "Publicar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {recovered && (
        <div className="mx-auto mt-6 flex max-w-[44rem] flex-wrap items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <span className="flex-1 min-w-48">
            Encontramos cambios que no alcanzaste a guardar ({timeAgo(recovered.savedAt, clock)}).
          </span>
          <Button type="button" size="sm" onClick={restoreDraft}>
            Recuperarlos
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              clearDraft(post?.id);
              setRecovered(null);
            }}
          >
            Descartar
          </Button>
        </div>
      )}

      {error && (
        <div role="alert" className="mx-auto mt-6 max-w-[44rem] rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Vista previa: tal como lo verá el cliente ── */}
      {preview && (
        <article className="mx-auto max-w-[44rem] pb-32 pt-12">
          <p className="mb-6 text-center text-xs text-muted-foreground">Vista previa · así se verá en el blog de tu tienda</p>
          <h1 className="text-center font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            {title || "Título del artículo"}
          </h1>
          <p className="mt-5 text-center text-xs text-muted-foreground">{minutes} min de lectura</p>
          {cover && (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
              <Image src={cover.src} unoptimized={cover.unoptimized} alt="" fill sizes="704px" className="object-cover" />
            </div>
          )}
          <div className="space-y-6 py-12">
            {excerpt && <p className="font-display text-xl leading-relaxed text-foreground">{excerpt}</p>}
            <ArticleBody markdown={body} />
          </div>
        </article>
      )}

      {/* ── Lienzo de escritura ── (oculto, no desmontado, en vista previa) */}
      <article className={"mx-auto max-w-[44rem] pb-32 pt-10" + (preview ? " hidden" : "")}>
        <input
          ref={coverFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => void uploadCover(e.target.files?.[0])}
        />
        {cover ? (
          <figure className="group relative mb-10 aspect-[16/9] overflow-hidden rounded-sm bg-muted">
            <Image src={cover.src} unoptimized={cover.unoptimized} alt="" fill sizes="704px" className="object-cover" />
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <Button type="button" size="sm" variant="outline" disabled={coverUploading} onClick={() => coverFileRef.current?.click()}>
                {coverUploading && <Loader2 className="size-3.5 animate-spin" />}
                Cambiar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => touch(setCoverUrl)("")}>
                Quitar
              </Button>
            </div>
          </figure>
        ) : (
          <button
            type="button"
            disabled={coverUploading}
            onClick={() => coverFileRef.current?.click()}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {coverUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {coverUploading ? "Subiendo portada…" : "Añadir imagen de portada"}
          </button>
        )}

        <AutoTextarea
          value={title}
          onChange={touch(setTitle)}
          placeholder="Título del artículo"
          aria-label="Título"
          maxLength={160}
          className="font-display text-4xl font-semibold leading-[1.08] tracking-tight placeholder:text-muted-foreground/45 sm:text-5xl"
        />
        <AutoTextarea
          value={excerpt}
          onChange={touch(setExcerpt)}
          placeholder="Una o dos frases que inviten a leer. Se ven en el listado del blog y en Google."
          aria-label="Entradilla"
          maxLength={400}
          className="mt-4 font-display text-xl leading-snug text-muted-foreground placeholder:text-muted-foreground/45 sm:text-2xl"
        />

        <div className="mt-8">
          <RichText
            key={editorSeed.key}
            initialMarkdown={editorSeed.markdown}
            onChange={(md, w) => {
              setBody((prev) => {
                if (prev.trim() !== md.trim()) setDirty(true);
                return md;
              });
              setWords(w);
            }}
            onImageUploaded={(url) => {
              pendingImages.current.add(url);
              setDirty(true);
            }}
            onSaveShortcut={quickSave}
          />
        </div>
      </article>

      {/* ── Panel de ajustes ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/10" onClick={() => setSettingsOpen(false)} aria-hidden />
      )}
      <aside
        id="post-settings"
        aria-label="Ajustes del artículo"
        hidden={!settingsOpen}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-border bg-background shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Ajustes del artículo</h2>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar ajustes" onClick={() => setSettingsOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-7 p-5">
          <ImageUploadField
            label="Imagen de portada"
            folder="blog"
            value={coverUrl}
            onChange={touch(setCoverUrl)}
            hint="Se ve arriba del artículo y en el listado del blog. Horizontal, idealmente 1600 × 900."
          />

          <FieldLabel
            label="Dirección del artículo"
            hint={
              isLive
                ? "Ya está publicado: si la cambias, los enlaces que hayas compartido dejan de funcionar."
                : "Se crea sola a partir del título. Cámbiala solo si quieres una más corta."
            }
          >
            <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-foreground/40">
              <span className="flex items-center bg-muted/40 px-2.5 text-xs text-muted-foreground">/blog/</span>
              <input
                value={slug}
                onChange={(e) => touch(setSlug)(e.target.value.toLowerCase())}
                placeholder={slugify(title) || "como-preparar-un-v60"}
                maxLength={120}
                className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm outline-none"
              />
            </div>
          </FieldLabel>

          <FieldLabel
            label="Fecha de publicación"
            hint="Vacío: se publica al darle Publicar. Con una fecha futura, el artículo queda programado y aparece solo ese día."
          >
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => touch(setPublishedAt)(e.target.value)}
              className={inputClass}
            />
          </FieldLabel>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Así se verá en Google</p>
            <div className="rounded-md border border-border p-4">
              <p className="truncate text-xs text-muted-foreground">
                {siteHost} › blog › {effectiveSlug}
              </p>
              <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{title || "Título del artículo"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {excerpt || "Escribe una entradilla: es el texto que Google muestra bajo el título."}
              </p>
            </div>
            <p className="mt-2 text-xs tabular-nums text-muted-foreground">
              Título {title.length}/60 · Entradilla {excerpt.length}/155
              {(title.length > 60 || excerpt.length > 155) && " · Google cortará lo que pase del límite"}
            </p>
          </div>

          <div className="border-t border-border pt-5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Atajos</p>
            <ul className="mt-2 space-y-1">
              <li>
                <kbd className="rounded border border-border px-1">⌘ S</kbd> guardar
              </li>
              <li>
                <kbd className="rounded border border-border px-1">/</kbd> en una línea vacía: insertar subtítulo, imagen, lista…
              </li>
              <li>
                <kbd className="rounded border border-border px-1">##</kbd> + espacio: subtítulo ·{" "}
                <kbd className="rounded border border-border px-1">-</kbd> + espacio: lista ·{" "}
                <kbd className="rounded border border-border px-1">&gt;</kbd> + espacio: cita
              </li>
              <li>Pega o arrastra una foto dentro del texto para subirla.</li>
            </ul>
          </div>

          {isLive && (
            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium">Quitar de la tienda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                El artículo vuelve a borrador: deja de verse en el blog, pero no se borra.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-3" disabled={pending} onClick={() => save("draft")}>
                Pasar a borrador
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/** Textarea que crece con el texto y no deja hacer saltos de línea (título, entradilla). */
function AutoTextarea({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      className={"block w-full resize-none overflow-hidden bg-transparent outline-none " + (className ?? "")}
      {...rest}
    />
  );
}
