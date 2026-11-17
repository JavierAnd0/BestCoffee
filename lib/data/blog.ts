import { env } from "../env";
import { apiServer } from "../api/client";
import { getCurrentTenant } from "./tenant";
import { BLOG_POSTS, findPost as findMock, featuredPost as featMock, type BlogPost } from "../mocks/blog";

// API list item: { id, slug, title, excerpt, coverUrl, publishedAt }. The
// detail endpoint adds body/category/author when available. We map defensively
// so missing optional fields fall back to sensible values.
interface ApiBlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverUrl?: string | null;
  publishedAt?: string;
  category?: string;
  readMinutes?: number;
  body?: string[] | string;
  author?: { name?: string; role?: string };
  tags?: string[];
  pullQuote?: string;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// El panel guarda el cuerpo como texto plano: cada bloque separado por una
// línea en blanco es un párrafo en la página pública.
function splitParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function readingMinutes(paragraphs: string[]): number {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** `brand`: nombre de la tienda, para firmar los artículos sin autor propio. */
function mapPost(p: ApiBlogItem, brand: string): BlogPost {
  const body = Array.isArray(p.body)
    ? p.body
    : p.body
      ? splitParagraphs(p.body)
      : [];
  return {
    slug: p.slug,
    category: p.category ?? "Blog",
    title: p.title,
    excerpt: p.excerpt ?? "",
    body,
    publishedAt: fmtDate(p.publishedAt),
    readMinutes: p.readMinutes ?? readingMinutes([p.excerpt ?? "", ...body]),
    author: { name: p.author?.name ?? `Equipo ${brand}`, role: p.author?.role ?? "Editorial" },
    tags: p.tags ?? [],
    pullQuote: p.pullQuote,
    coverUrl: p.coverUrl ?? null,
  };
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS;
  try {
    const [api, tenant] = await Promise.all([apiServer(), getCurrentTenant()]);
    const { data, error } = await api.GET("/v1/blog");
    if (error || !data) return [];
    const items =
      (data as unknown as { items?: ApiBlogItem[]; data?: ApiBlogItem[] }).items ??
      (data as unknown as { items?: ApiBlogItem[]; data?: ApiBlogItem[] }).data ??
      [];
    return items.map((p) => mapPost(p, tenant.brand));
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  if (env.useMocks) return findMock(slug);
  try {
    const [api, tenant] = await Promise.all([apiServer(), getCurrentTenant()]);
    const { data, error } = await api.GET("/v1/blog/{slug}", {
      params: { path: { slug } },
    });
    if (error || !data) {
      // Detail endpoint may not exist yet — fall back to the tenant's own list.
      const all = await listBlogPosts();
      return all.find((p) => p.slug === slug);
    }
    return mapPost(data as unknown as ApiBlogItem, tenant.brand);
  } catch {
    return undefined;
  }
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  if (env.useMocks) return featMock();
  const all = await listBlogPosts();
  return all[0] ?? null;
}

export async function listRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, limit);
  const all = await listBlogPosts();
  return all.filter((p) => p.slug !== slug).slice(0, limit);
}
