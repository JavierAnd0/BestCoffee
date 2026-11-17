import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getBlogPost, listRelatedPosts } from "@/lib/data/blog";
import { requireFeature } from "@/lib/data/feature-guard";
import { getCurrentTenant } from "@/lib/data/tenant";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd, getSiteUrl } from "@/lib/seo";
import { remoteImage } from "@/lib/remote-image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artículo no encontrado" };
  const tenant = await getCurrentTenant();
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      siteName: tenant.brand,
      locale: "es_CO",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      authors: [post.author.name],
      tags: post.tags,
    },
  };
}

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireFeature("blog");
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const [related, tenant, siteUrl] = await Promise.all([
    listRelatedPosts(post.slug),
    getCurrentTenant(),
    getSiteUrl(),
  ]);
  const cover = remoteImage(post.coverUrl);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            articleSection: post.category,
            keywords: post.tags.join(", "),
            inLanguage: "es-CO",
            url: `${siteUrl}/blog/${post.slug}`,
            mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
            author: { "@type": "Person", name: post.author.name, jobTitle: post.author.role },
            publisher: { "@id": `${siteUrl}/#organization`, name: tenant.brand },
          },
          breadcrumbLd(siteUrl, [
            { name: "Inicio", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
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

        {cover && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-10">
            <div className="relative aspect-[16/9] rounded-lg bg-muted overflow-hidden">
              <Image
                src={cover.src}
                unoptimized={cover.unoptimized}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

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

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
              {post.tags.map((t) => (
                <Badge key={t} variant="outline" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-center mb-10">
              Sigue leyendo
            </h2>
            <div className="grid sm:grid-cols-3 gap-x-8 gap-y-12">
              {related.map((p) => {
                const relatedCover = remoteImage(p.coverUrl);
                return (
                  <article key={p.slug}>
                    {relatedCover && (
                      <Link
                        href={`/blog/${p.slug}`}
                        tabIndex={-1}
                        aria-hidden
                        className="relative block aspect-[16/10] rounded-lg bg-muted mb-3 overflow-hidden hover:opacity-90 transition-opacity"
                      >
                        <Image
                          src={relatedCover.src}
                          unoptimized={relatedCover.unoptimized}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover"
                        />
                      </Link>
                    )}
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
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
