import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BLOG_CATEGORIES, BLOG_POSTS, featuredPost } from "@/lib/mocks/blog";

export const metadata: Metadata = { title: "Blog · Café y comunidad" };

export default function BlogIndex() {
  const featured = featuredPost();
  const rest = BLOG_POSTS.filter((p) => p.slug !== featured.slug);

  return (
    <>
      <section
        aria-label="Cabecera editorial"
        className="relative isolate h-[420px] grid place-items-center overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#3b2418] via-[#5a3826] to-[#a25234]"
        />
        <div className="relative text-center text-white px-6">
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
            El blog de ORÍGEN
          </div>
          <h1 className="mt-4 font-display text-6xl lg:text-7xl font-semibold tracking-tight">
            Café y comunidad
          </h1>
        </div>
      </section>

      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap justify-center gap-2">
          {BLOG_CATEGORIES.map((c, i) => (
            <button
              key={c}
              className={
                "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                (i === 0
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <Eyebrow>Artículo destacado</Eyebrow>
        <article className="mt-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Link
            href={`/blog/${featured.slug}`}
            className="aspect-[4/3] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground"
          >
            {featured.title}
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="uppercase tracking-[0.12em] font-normal">
                {featured.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {featured.publishedAt} · {featured.readMinutes} min de lectura
              </span>
            </div>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
              {featured.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {featured.excerpt}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="size-9 rounded-full bg-foreground/10" aria-hidden />
              <span className="text-xs text-muted-foreground">
                Por {featured.author.name} · {featured.author.role}
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-6"
              render={<Link href={`/blog/${featured.slug}`}>Leer la historia →</Link>}
            />
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Lo más reciente
          </h2>
          <span className="text-xs text-muted-foreground">{rest.length} artículos</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {rest.map((p) => (
            <ArticleCard key={p.slug} post={p} />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Button variant="outline">Cargar más artículos</Button>
        </div>
      </section>
    </>
  );
}

function ArticleCard({ post }: { post: (typeof BLOG_POSTS)[number] }) {
  return (
    <article>
      <Link
        href={`/blog/${post.slug}`}
        className="block aspect-[16/10] rounded-lg bg-muted mb-4 hover:opacity-90 transition-opacity grid place-items-center text-xs text-muted-foreground"
      >
        {post.title}
      </Link>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="uppercase tracking-[0.12em] font-normal">
          {post.category}
        </Badge>
        <span className="text-muted-foreground">
          {post.publishedAt} · {post.readMinutes} min
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight leading-snug">
        <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-2">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
    </article>
  );
}
