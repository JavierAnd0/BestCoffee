import type { ContentKind } from "@/lib/data/admin-content";

/** Qué es cada tipo de bloque y dónde lo muestra la tienda (lib/data/content.ts). */
export const BLOCK_KINDS: Record<ContentKind, { label: string; where: string; many: boolean }> = {
  ANNOUNCEMENT: {
    label: "Anuncio",
    where: "Barra superior de todas las páginas. Los anuncios activos rotan.",
    many: true,
  },
  HERO: {
    label: "Portada (hero)",
    where: "Titular y botón principal del inicio. Se usa el primero activo por orden.",
    many: false,
  },
  SPOTLIGHT: {
    label: "Producto destacado",
    where: "Sección destacada del inicio con un producto. Se usa el primero activo por orden.",
    many: false,
  },
  FEATURED_BUNDLE: {
    label: "Paquete destacado",
    where: "Paquete de varios productos en el inicio. Se usa el primero activo por orden.",
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
