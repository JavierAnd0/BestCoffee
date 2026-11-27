"use client";

import { useEffect, useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
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
 * Sube una imagen de contenido a Blob (carpeta de la tienda) y devuelve su URL.
 * Lanza un Error con un mensaje para el operador si el archivo no sirve o la
 * subida falla. La usa el editor del blog para las imágenes dentro del texto.
 */
export async function uploadContentImage(folder: ContentFolder, file: File): Promise<string> {
  if (!ACCEPT.split(",").includes(file.type)) {
    throw new Error("Formato no soportado: usa JPG, PNG, WebP o AVIF.");
  }
  if (file.size > MAX_BYTES) throw new Error("La imagen pesa más de 8 MB.");
  const prefix = await contentUploadPrefixAction(folder);
  if (!prefix.ok) throw new Error(prefix.error);
  const blob = await upload(`${prefix.data}${safeFileName(file.name)}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob-upload",
  });
  return blob.url;
}

const isPreviewable = (v: string) => /^(https:\/\/|\/(?!\/))/.test(v);

/**
 * Campo de imagen del panel de contenido: arrastrar y soltar, elegir un archivo
 * o pegarlo (Ctrl/Cmd+V) lo sube a Vercel Blob (carpeta de la tienda); también
 * acepta una URL. El valor viaja en un input normal con `name`, así que sirve
 * en formularios de acción y en formularios controlados (`value` + `onChange`).
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
  required,
}: {
  label: string;
  name?: string;
  folder: ContentFolder;
  defaultValue?: string | null;
  value?: string;
  onChange?: (url: string) => void;
  hint?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = controlled ?? internal;
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sin imagen se ofrece la zona para soltar; el enlace es la vía secundaria.
  const [showUrl, setShowUrl] = useState(false);
  const [broken, setBroken] = useState(false);
  // Archivos subidos en esta edición y aún sin guardar: si se reemplazan, o si
  // se sale sin guardar, se borran de Blob. Al enviar el formulario, el valor
  // actual deja de estar en la lista (lo guardó el formulario; si al guardar
  // reemplaza una imagen anterior, esa la borra la acción del servidor).
  const uploaded = useRef<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const labelId = useId();

  useEffect(() => {
    const input = valueRef.current;
    const form = input?.form;
    const pending = uploaded.current;
    // El input refleja el valor actual (también en modo controlado).
    const onSubmit = () => {
      if (input) pending.delete(input.value);
    };
    // Al cerrar la pestaña o salir del sitio no hay tiempo para una acción de
    // servidor: el aviso va con sendBeacon.
    const onPageHide = () => {
      if (!pending.size) return;
      const body = new Blob([JSON.stringify({ urls: [...pending] })], { type: "application/json" });
      navigator.sendBeacon?.("/api/admin/content-image-discard", body);
      pending.clear();
    };
    form?.addEventListener("submit", onSubmit);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      form?.removeEventListener("submit", onSubmit);
      window.removeEventListener("pagehide", onPageHide);
      // Salir del formulario dentro del panel (o quitar una sección) sin guardar.
      for (const url of pending) void discardContentImageAction(url);
      pending.clear();
    };
  }, []);

  function setValue(next: string) {
    const prev = value;
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
    setBroken(false);
    if (next) setError(null);
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
      setShowUrl(false);
    } catch (e) {
      setError(e instanceof Error ? `No se pudo subir la imagen: ${e.message}` : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!uploading) void handleFile(e.dataTransfer.files?.[0]);
    },
    onPaste: (e: React.ClipboardEvent) => {
      const file = Array.from(e.clipboardData.files)[0];
      if (file && !uploading) {
        e.preventDefault();
        void handleFile(file);
      }
    },
  };

  const pick = () => fileRef.current?.click();
  const hasImage = !!value;

  return (
    <div role="group" aria-labelledby={labelId}>
      <span
        id={labelId}
        className="block admin-label mb-1.5"
      >
        {label}
      </span>

      <div className="relative">
        {hasImage ? (
          <div
            {...dropHandlers}
            className={
              "group relative overflow-hidden rounded-md border bg-muted/40 transition-colors " +
              (dragging ? "border-foreground ring-2 ring-foreground/20" : "border-border")
            }
          >
            {isPreviewable(value) && !broken ? (
              // Vista previa: URL libre, se pide directo al host (no pasa por el optimizador).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                onError={() => setBroken(true)}
                className="aspect-[16/7] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[16/7] w-full place-items-center px-6 text-center text-xs text-muted-foreground">
                No se puede mostrar la vista previa de este enlace.
              </div>
            )}
            {(dragging || uploading) && (
              <div className="absolute inset-0 grid place-items-center bg-background/80 text-sm font-medium backdrop-blur-[2px]">
                {uploading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Subiendo…
                  </span>
                ) : (
                  "Suelta para reemplazar"
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            {...dropHandlers}
            className={
              "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 " +
              (dragging
                ? "border-foreground bg-foreground/[0.04]"
                : error
                  ? "border-red-400 bg-red-50/40 hover:border-red-500"
                  : "border-input bg-muted/20 hover:border-foreground/40 hover:bg-muted/40")
            }
          >
            {uploading ? (
              <>
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="text-sm font-medium">Subiendo imagen…</span>
              </>
            ) : (
              <>
                <span className="grid size-10 place-items-center rounded-full bg-background ring-1 ring-border">
                  <ImagePlus className="size-5 text-muted-foreground" />
                </span>
                <span className="text-sm">
                  {dragging ? (
                    <span className="font-medium">Suelta la imagen aquí</span>
                  ) : (
                    <>
                      Arrastra una imagen o{" "}
                      <span className="font-medium underline underline-offset-4">elige un archivo</span>
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP o AVIF · hasta 8 MB</span>
              </>
            )}
          </button>
        )}

        {/* Valor real del campo. Con `required`, el navegador lo valida aquí y
            mostramos el aviso propio en vez de la burbuja nativa. */}
        <input
          ref={valueRef}
          name={name}
          value={value}
          required={required}
          onChange={() => {}}
          onInvalid={(e) => {
            e.preventDefault();
            setError("Agrega una imagen.");
          }}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {hasImage && (
          <>
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={pick} className="gap-1.5">
              <RefreshCw className="size-3.5" />
              Cambiar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => setValue("")}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="size-3.5" />
              Quitar
            </Button>
          </>
        )}
        {!showUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrl(true)}
            className="gap-1.5 text-muted-foreground"
          >
            <Link2 className="size-3.5" />
            {hasImage ? "Ver enlace" : "Usar un enlace"}
          </Button>
        )}
      </div>

      {showUrl && (
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value.trim())}
          maxLength={500}
          placeholder={placeholder}
          aria-label={`${label}: enlace de la imagen`}
          autoFocus
          className={inputClass + " mt-2"}
        />
      )}

      {error ? (
        <span role="alert" className="mt-1.5 block text-xs text-red-700">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
