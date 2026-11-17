"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentUploadPrefixAction, discardContentImageAction } from "@/lib/actions/content-images";
import type { ContentFolder } from "@/lib/storage/blob-paths";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

/** Nombre de archivo seguro para la ruta en Blob ("Foto Café 1.JPG" → "foto-cafe-1.jpg"). */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return `${base || "imagen"}${ext ? `.${ext}` : ""}`;
}

/**
 * Campo de imagen del panel de contenido: pegar una URL o subir un archivo a
 * Vercel Blob (carpeta de la tienda). El valor viaja en un input normal con
 * `name`, así que sirve en formularios de acción y en formularios controlados
 * (`value` + `onChange`).
 */
export function ImageUploadField({
  label,
  name,
  folder,
  defaultValue,
  value: controlled,
  onChange,
  hint,
  placeholder = "https://",
}: {
  label: string;
  name?: string;
  folder: ContentFolder;
  defaultValue?: string | null;
  value?: string;
  onChange?: (url: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = controlled ?? internal;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Archivos subidos en esta edición: si se reemplazan, se borran de Blob.
  const uploaded = useRef<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function setValue(next: string) {
    const prev = value;
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
    if (prev && prev !== next && uploaded.current.has(prev)) {
      uploaded.current.delete(prev);
      void discardContentImageAction(prev);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Formato no soportado: usa JPG, PNG, WebP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen pesa más de 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const prefix = await contentUploadPrefixAction(folder);
      if (!prefix.ok) {
        setError(prefix.error);
        return;
      }
      const blob = await upload(`${prefix.data}${safeFileName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
      });
      uploaded.current.add(blob.url);
      setValue(blob.url);
    } catch (e) {
      setError(e instanceof Error ? `No se pudo subir la imagen: ${e.message}` : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <div className="flex gap-2 items-start">
        {value && /^(https:\/\/|\/(?!\/))/.test(value) && (
          // Vista previa: URL libre, se pide directo al host (no pasa por el optimizador).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-10 shrink-0 rounded border border-border object-cover bg-muted" />
        )}
        <input
          type="text"
          inputMode="url"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={500}
          placeholder={placeholder}
          aria-label={label}
          className={inputClass}
        />
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 gap-1.5"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Subir
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Quitar imagen"
            onClick={() => setValue("")}
            className="shrink-0"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      {error ? (
        <span role="alert" className="mt-1 block text-xs text-red-700">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
