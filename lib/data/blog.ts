import { env } from "../env";
import { apiServer } from "../api/client";
import { BLOG_POSTS, findPost as findMock, featuredPost as featMock, type BlogPost } from "../mocks/blog";

// API list item: { id, slug, title, excerpt, coverUrl, publishedAt }. The
// detail endpoint adds body/category/author when available. We map defensively
// so missing optional fields fall back to sensible values.
interface ApiBlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverUrl?: string;
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

function mapPost(p: ApiBlogItem): BlogPost {
  const body = Array.isArray(p.body) ? p.body : p.body ? [p.body] : [p.excerpt ?? ""];
  return {
    slug: p.slug,
    category: p.category ?? "Origen",
    title: p.title,
    excerpt: p.excerpt ?? "",
    body,
    publishedAt: fmtDate(p.publishedAt),
    readMinutes: p.readMinutes ?? 5,
    author: { name: p.author?.name ?? "Equipo ORÍGEN", role: p.author?.role ?? "Editorial" },
    tags: p.tags ?? [],
    pullQuote: p.pullQuote,
  };
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS;
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/blog");
  if (error || !data) return BLOG_POSTS;
  const items = (data as unknown as { items: ApiBlogItem[] }).items ?? [];
  return items.map(mapPost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  if (env.useMocks) return findMock(slug);
  const api = await apiServer();
  const { data, error } = await api.GET("/v1/blog/{slug}", {
    params: { path: { slug } },
  });
  if (error || !data) {
    // Detail endpoint may not exist yet — fall back to the list entry.
    const all = await listBlogPosts();
    return all.find((p) => p.slug === slug);
  }
  return mapPost(data as unknown as ApiBlogItem);
}

export async function getFeaturedPost(): Promise<BlogPost> {
  if (env.useMocks) return featMock();
  const all = await listBlogPosts();
  return all[0] ?? featMock();
}

export async function listRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, limit);
  const all = await listBlogPosts();
  return all.filter((p) => p.slug !== slug).slice(0, limit);
}
