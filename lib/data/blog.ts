import { env } from "../env";
import { BLOG_POSTS, findPost as findMock, featuredPost as featMock, type BlogPost } from "../mocks/blog";

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS;
  throw new Error("listBlogPosts: live API not wired yet");
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  if (env.useMocks) return findMock(slug);
  throw new Error("getBlogPost: live API not wired yet");
}

export async function getFeaturedPost(): Promise<BlogPost> {
  if (env.useMocks) return featMock();
  throw new Error("getFeaturedPost: live API not wired yet");
}

export async function listRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  if (env.useMocks) return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, limit);
  throw new Error("listRelatedPosts: live API not wired yet");
}
