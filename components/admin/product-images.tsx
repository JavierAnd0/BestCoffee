"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Upload } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import {
  attachProductImageAction,
  deleteBlobAction,
  removeProductImageAction,
  reorderProductImagesAction,
} from "@/lib/actions/product-images";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

interface Uploading {
  key: string;
  name: string;
}

/**
 * Galería del producto en el admin: subir (Vercel Blob), reordenar y eliminar.
 * Con `productId` cada cambio se guarda en la API al instante. Sin él (producto
 * nuevo) las imágenes quedan en memoria y se exponen vía `onChange` para
 * registrarlas al crear el producto.
 */
export function ProductImages({
  productId,
  initial,
  productName,
  onChange,
}: {
  productId?: string;
  initial: ProductImage[];
  productName: string;
  onChange?: (images: ProductImage[]) => void;
}) {
  const [images, setImages] = useState<ProductImage[]>(initial);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(images);
  }, [images]);

  async function uploadOne(file: File) {
    const key = `${file.name}-${Date.now()}-${Math.random()}`;
    if (!ACCEPT.split(",").includes(file.type)) {
      setError(`${file.name}: formato no soportado (usa JPG, PNG, WebP o AVIF).`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`${file.name}: pesa más de 8 MB.`);
      return;
    }
    setUploading((u) => [...u, { key, name: file.name }]);
    try {
      const blob = await upload(`products/${productId ?? "draft"}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
      });
      const alt = productName || file.name.replace(/\.[^.]+$/, "");
      if (productId) {
        const r = await attachProductImageAction(productId, blob.url, alt);
        if (!r.ok) {
          await deleteBlobAction(blob.url);
          setError(r.error);
          return;
        }
        setImages((arr) => [...arr, r.data]);
      } else {
        setImages((arr) => [...arr, { id: `draft_${key}`, url: blob.url, alt }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading((u) => u.filter((x) => x.key !== key));
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    // Secuencial para respetar el orden en que el vendedor las eligió.
    (async () => {
      for (const f of Array.from(files)) await uploadOne(f);
    })();
  }

  async function persistOrder(next: ProductImage[], prev: ProductImage[]) {
    setImages(next);
    if (!productId) return;
    const r = await reorderProductImagesAction(productId, next.map((i) => i.id));
    if (!r.ok) {
      setImages(prev);
      setError(r.error);
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = images.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void persistOrder(next, images);
  }

  async function remove(img: ProductImage) {
    const prev = images;
    setImages(prev.filter((i) => i.id !== img.id));
    if (productId) {
      const r = await removeProductImageAction(productId, img.id, img.url);
      if (!r.ok) {
        setImages(prev);
        setError(r.error);
      }
    } else {
      await deleteBlobAction(img.url);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={
              "group relative aspect-square overflow-hidden rounded-md border bg-muted cursor-grab active:cursor-grabbing " +
              (dragIndex === i ? "opacity-40 " : "") +
              (i === 0 ? "border-foreground ring-1 ring-foreground" : "border-border")
            }
          >
            <Image
              src={img.url}
              alt={img.alt ?? ""}
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover pointer-events-none"
            />
            {i === 0 && (
              <span className="absolute top-2 left-2 rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <IconBtn label="Mover a la izquierda" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  <ChevronLeft className="size-4" />
                </IconBtn>
                <IconBtn
                  label="Mover a la derecha"
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                >
                  <ChevronRight className="size-4" />
                </IconBtn>
              </div>
              <IconBtn label="Eliminar imagen" onClick={() => remove(img)}>
                <Trash2 className="size-4" />
              </IconBtn>
            </div>
          </div>
        ))}

        {uploading.map((u) => (
          <div
            key={u.key}
            className="aspect-square rounded-md border border-border bg-muted/40 grid place-items-center text-xs text-muted-foreground"
          >
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <Loader2 className="size-5 animate-spin" />
              <span className="line-clamp-2 break-all">{u.name}</span>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (dragIndex !== null) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (dragIndex !== null) return;
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={
            "aspect-square rounded-md border border-dashed grid place-items-center text-xs transition-colors " +
            (dragOver
              ? "border-foreground bg-muted text-foreground"
              : "border-border bg-muted/30 text-muted-foreground hover:border-foreground/40 hover:text-foreground")
          }
        >
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <Upload className="size-5" />
            <span>Subir fotos</span>
            <span className="text-[10px] opacity-70">o arrástralas aquí</span>
          </div>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Arrastra para reordenar. La primera imagen es la principal del catálogo. JPG, PNG, WebP o
        AVIF, hasta 8 MB. Recomendado: cuadradas, mínimo 1200 × 1200 px.
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-7 place-items-center rounded-sm bg-background/90 text-foreground hover:bg-background disabled:opacity-30"
    >
      {children}
    </button>
  );
}
