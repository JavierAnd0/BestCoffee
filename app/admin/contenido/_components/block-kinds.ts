import type { ContentKind } from "@/lib/data/admin-content";

/** Qué es cada tipo de bloque y dónde lo muestra la tienda (lib/data/content.ts). */
export const BLOCK_KINDS: Record<
  ContentKind,
  { label: string; where: string; many: boolean; add: string }
> = {
  ANNOUNCEMENT: {
    label: "Anuncio",
    add: "Agregar anuncio",
    where: "La franja delgada arriba de todas las páginas. Si hay varios visibles, se turnan.",
    many: true,
  },
  HERO: {
    label: "Portada (hero)",
    add: "Agregar portada",
    where: "Lo primero que se ve al entrar: el titular grande y el botón principal. Se muestra una sola.",
    many: false,
  },
  SPOTLIGHT: {
    label: "Producto destacado",
    add: "Agregar destacado",
    where: "Una sección del inicio dedicada a un solo producto. Se muestra uno solo.",
    many: false,
  },
  FEATURED_BUNDLE: {
    label: "Paquete destacado",
    add: "Agregar paquete",
    where: "Un grupo de productos que se venden juntos, en el inicio. Se muestra uno solo.",
    many: false,
  },
};

export const KIND_ORDER: ContentKind[] = ["ANNOUNCEMENT", "HERO", "SPOTLIGHT", "FEATURED_BUNDLE"];

export function isContentKind(v: unknown): v is ContentKind {
  return typeof v === "string" && (KIND_ORDER as string[]).includes(v);
}

/** Resumen legible de un bloque para la lista. */
export function blockSummary(kind: ContentKind, data: Record<string, unknown>): string {
  const s = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  switch (kind) {
    case "ANNOUNCEMENT":
      return s("text");
    case "HERO":
      return s("title");
    case "SPOTLIGHT":
      return s("title") || s("productSlug");
    case "FEATURED_BUNDLE": {
      const n = Array.isArray(data.productSlugs) ? data.productSlugs.length : 0;
      return `${s("title")} · ${n} producto${n === 1 ? "" : "s"}`;
    }
  }
}

/** Vigencia efectiva de un bloque ahora mismo. */
export function blockState(b: { active: boolean; startsAt: string | null; endsAt: string | null }, now = Date.now()) {
  if (!b.active) return "Inactivo" as const;
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return "Programado" as const;
  if (b.endsAt && new Date(b.endsAt).getTime() < now) return "Vencido" as const;
  return "Visible" as const;
}
