import { env } from "../env";
import { operatorFetch } from "../api/gateway";

// Lecturas del panel para el contenido editorial de la tienda: bloques de la
// home (/v1/admin/content), blog, guías de preparación y sedes. Tipos locales:
// lib/api/types.ts es generado y aún no trae estos endpoints.

// ── Bloques de la home ────────────────────────────────────────────────────────

export type ContentKind = "ANNOUNCEMENT" | "HERO" | "SPOTLIGHT" | "FEATURED_BUNDLE";

export interface ContentCta {
  label: string;
  href: string;
}

export interface AnnouncementData {
  text: string;
  cta?: ContentCta;
}
export interface HeroData {
  title: string;
  subtitle?: string;
  cta?: ContentCta;
  imageDesktop: string;
  imageMobile?: string;
}
export interface SpotlightData {
  productSlug: string;
  title?: string;
}
export interface FeaturedBundleData {
  title: string;
  productSlugs: string[];
}

export interface ContentBlock {
  id: string;
  kind: ContentKind;
  data: Record<string, unknown>;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  position: number;
  updatedAt: string;
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export type BlogPostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  status: BlogPostStatus;
  /** Solo en el detalle. */
  body?: string;
}

// ── Guías ─────────────────────────────────────────────────────────────────────

export type BrewDifficulty = "Fácil" | "Media" | "Avanzada";

export interface AdminBrewStep {
  title: string;
  body: string;
  durationSec: number;
}

export interface AdminBrewGuide {
  id: string;
  slug: string;
  title: string;
  method: string | null;
  coverUrl: string | null;
  summary: string;
  totalTime: string;
  difficulty: BrewDifficulty;
  steps: AdminBrewStep[];
  updatedAt: string;
}

// ── Sedes ─────────────────────────────────────────────────────────────────────

export interface AdminLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  /** La API lo guarda como JSON; el panel solo escribe texto. */
  hours: unknown;
  lat: number | null;
  lng: number | null;
}

/** `error`: no se pudo leer (no se muestran datos de ejemplo en su lugar). */
export type AdminRead<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function read<T>(path: string, fallback: T): Promise<AdminRead<T>> {
  // Con mocks no hay API: el panel arranca vacío en vez de mostrar contenido inventado.
  if (env.useMocks) return { ok: true, data: fallback };
  const r = await operatorFetch<T>(path);
  if (!r.ok) return { ok: false, status: r.status, error: r.error };
  return { ok: true, data: r.data };
}

export function listContentBlocks() {
  return read<ContentBlock[]>("/v1/admin/content", []);
}

export async function getContentBlock(id: string) {
  return read<ContentBlock | null>(`/v1/admin/content/${encodeURIComponent(id)}`, null);
}

export function listAdminBlogPosts() {
  return read<AdminBlogPost[]>("/v1/admin/blog", []);
}

export function getAdminBlogPost(id: string) {
  return read<AdminBlogPost | null>(`/v1/admin/blog/${encodeURIComponent(id)}`, null);
}

export function listAdminBrewGuides() {
  return read<AdminBrewGuide[]>("/v1/admin/brew-guides", []);
}

export function getAdminBrewGuide(id: string) {
  return read<AdminBrewGuide | null>(`/v1/admin/brew-guides/${encodeURIComponent(id)}`, null);
}

export function listAdminLocations() {
  return read<AdminLocation[]>("/v1/admin/locations", []);
}

export function getAdminLocation(id: string) {
  return read<AdminLocation | null>(`/v1/admin/locations/${encodeURIComponent(id)}`, null);
}
