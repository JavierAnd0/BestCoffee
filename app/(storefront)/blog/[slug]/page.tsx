import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getBlogPost, listRelatedPosts } from "@/lib/data/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const related = await listRelatedPosts(post.slug);

  return (
    <>
      <article>
        <header className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12 text-center">
          <Link
            href="/blog"
            className="inline-block text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Volver al blog
          </Link>
          <Badge variant="outline" className="uppercase tracking-[0.14em] font-normal">
            {post.category}
          </Badge>
          <h1 className="mt-5 font-display text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            {post.title}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="size-8 rounded-full bg-foreground/10" aria-hidden />
            <span className="text-xs text-muted-foreground">
              Por {post.author.name} · {post.publishedAt} · {post.readMinutes} min
            </span>
          </div>
        </header>

        <div
          aria-label={`Portada: ${post.title}`}
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-10"
        >
          <div className="aspect-[16/9] rounded-lg bg-muted grid place-items-center text-sm text-muted-foreground">
            Foto de portada
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 space-y-6">
          <p className="font-display text-xl text-foreground leading-relaxed">
            {post.excerpt}
          </p>
          {post.body.map((para, i) => (
            <p key={i} className="text-base text-foreground/90 leading-relaxed">
              {para}
            </p>
          ))}

          {post.pullQuote && (
            <blockquote className="my-10 border-l-2 border-foreground pl-6 py-2">
              <div className="font-display text-2xl lg:text-3xl font-semibold leading-snug">
                “{post.pullQuote}”
              </div>
            </blockquote>
          )}

          <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
            {post.tags.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>

          <div className="mt-10 flex gap-4 items-start rounded-lg border border-border bg-muted/30 p-5">
            <span className="size-14 rounded-full bg-foreground/10" aria-hidden />
            <div>
              <div className="font-display text-lg font-semibold">{post.author.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{post.author.role}</div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Investiga y narra el viaje del café desde la finca hasta la tostadora.
                Le interesan los procesos de beneficio y las economías de cosecha.
              </p>
            </div>
          </div>
        </div>
      </article>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-center mb-10">
            Sigue leyendo
          </h2>
          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-12">
            {related.map((p) => (
              <article key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block aspect-[16/10] rounded-lg bg-muted mb-3 hover:opacity-90 transition-opacity grid place-items-center text-xs text-muted-foreground"
                >
                  {p.title}
                </Link>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="uppercase tracking-[0.12em] font-normal">
                    {p.category}
                  </Badge>
                  <span className="text-muted-foreground">{p.publishedAt}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold tracking-tight leading-snug">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="hover:underline underline-offset-2"
                  >
                    {p.title}
                  </Link>
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
