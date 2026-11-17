"use client";

import { useState } from "react";
import { saveBlogPostAction } from "@/lib/actions/admin-content";
import { useContentForm } from "../_components/use-content-form";
import type { AdminBlogPost } from "@/lib/data/admin-content";
import { FormError, FormSection, TextArea, TextField, FieldLabel, inputClass, toLocalInput } from "../_components/fields";
import { FormActions } from "../_components/submit-button";

export function BlogForm({ post }: { post?: AdminBlogPost }) {
  const { error, onSubmit, pending } = useContentForm(saveBlogPostAction);
  const [status, setStatus] = useState(post && post.status !== "DRAFT" ? "published" : "draft");

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {post && <input type="hidden" name="id" value={post.id} />}
      <FormError error={error} />

      <FormSection>
        <TextField label="Título" name="title" required maxLength={160} defaultValue={post?.title} />
        <TextField
          label="Dirección (opcional)"
          name="slug"
          maxLength={120}
          defaultValue={post?.slug}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="se-genera-del-titulo"
          className="font-mono"
          hint="Aparece en /blog/<dirección>. Minúsculas, números y guiones."
        />
        <TextArea
          label="Entradilla (opcional)"
          name="excerpt"
          rows={2}
          maxLength={400}
          defaultValue={post?.excerpt ?? ""}
          hint="Resumen corto que se muestra en el listado y al inicio del artículo."
        />
        <TextArea
          label="Texto"
          name="body"
          required
          rows={16}
          maxLength={50000}
          defaultValue={post?.body ?? ""}
          hint="Deja una línea en blanco entre párrafos."
        />
        <TextField
          label="Imagen de portada (URL, opcional)"
          name="coverUrl"
          type="url"
          maxLength={500}
          defaultValue={post?.coverUrl ?? ""}
          placeholder="https://"
        />
      </FormSection>

      <FormSection title="Publicación">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="status" value="draft" checked={status === "draft"} onChange={() => setStatus("draft")} />
            Borrador
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="status" value="published" checked={status === "published"} onChange={() => setStatus("published")} />
            Publicado
          </label>
        </div>
        {status === "published" && (
          <FieldLabel
            label="Fecha de publicación (opcional)"
            hint="Vacío: ahora (o la fecha que ya tenía). Una fecha futura lo programa."
          >
            <input
              type="datetime-local"
              name="publishedAt"
              defaultValue={toLocalInput(post?.publishedAt)}
              className={inputClass + " max-w-xs"}
            />
          </FieldLabel>
        )}
      </FormSection>

      <FormActions pending={pending} cancelHref="/admin/contenido/blog" submitLabel={post ? "Guardar cambios" : "Crear artículo"} />
    </form>
  );
}
