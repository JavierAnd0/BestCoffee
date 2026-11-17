// Páginas editoriales por tienda (historia, impacto, sostenibilidad, mayoristas)
// y el interruptor de la página de sedes. El contenido lo escribe cada tienda en
// su panel (Contenido → Páginas) y se guarda en la API (/v1/admin/pages); la
// tienda lo lee de /v1/content/pages/:slug. Tipos locales: lib/api/types.ts es
// generado y aún no trae estos endpoints.

import type { EditorialPage } from "./types";

export type ContentPageSlug = Exclude<EditorialPage, "tiendas">;

export const CONTENT_PAGES: { slug: ContentPageSlug; label: string; path: string; help: string }[] = [
  {
    slug: "historia",
    label: "Nuestra historia",
    path: "/historia",
    help: "Cómo nació la marca y lo que defiende.",
  },
  {
    slug: "impacto",
    label: "Impacto",
    path: "/impacto",
    help: "Cifras y prácticas con productores y empaques.",
  },
  {
    slug: "sostenibilidad",
    label: "Sostenibilidad",
    path: "/sostenibilidad",
    help: "Compromisos ambientales y sociales, en tarjetas.",
  },
  {
    slug: "mayoristas",
    label: "Mayoristas",
    path: "/mayoristas",
    help: "Oferta para negocios y cómo contactar a la tienda.",
  },
];

export const isContentPageSlug = (s: string): s is ContentPageSlug =>
  CONTENT_PAGES.some((p) => p.slug === s);

export interface PageHighlight {
  value: string;
  label: string;
}

export interface PageSection {
  title?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface PageCta {
  title?: string;
  body?: string;
  label?: string;
  href?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface EditorialPageContent {
  eyebrow?: string;
  title: string;
  intro?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  highlights?: PageHighlight[];
  sectionsEyebrow?: string;
  sectionsTitle?: string;
  sections: PageSection[];
  cta?: PageCta;
  contact?: { email?: string; phone?: string };
  updatedAt?: string;
}

/** Fila del panel: estado guardado y lo que ve la tienda. */
export interface AdminEditorialPage {
  slug: EditorialPage;
  kind: "content" | "toggle";
  /** Activada en `branding.pages` (lo mismo que ve el superadmin). */
  active: boolean;
  /** Visible en la tienda: activada y, si es de contenido, con contenido. */
  live: boolean;
  content: EditorialPageContent | null;
}
