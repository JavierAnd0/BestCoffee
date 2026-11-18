import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import { remoteImage } from "@/lib/remote-image";

/**
 * Cuerpo de un artículo del blog. El panel lo guarda en Markdown (subtítulos,
 * negrilla, listas, citas, enlaces e imágenes); los artículos viejos en texto
 * plano por párrafos son Markdown válido y se ven igual que antes. No se
 * interpreta HTML crudo.
 */
const components: Components = {
  h2: ({ children }) => (
    <h2 className="font-display text-3xl font-semibold tracking-tight leading-tight pt-6">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-2xl font-semibold tracking-tight leading-snug pt-4">{children}</h3>
  ),
  p: ({ children }) => <p className="text-base text-foreground/90 leading-relaxed">{children}</p>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className="underline underline-offset-4 decoration-[var(--accent)] hover:text-[var(--accent)]"
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-foreground/90 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 text-foreground/90 marker:text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-2 border-foreground pl-6 font-display text-2xl leading-snug [&_p]:font-display [&_p]:text-2xl [&_p]:text-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
  img: ({ src, alt }) => {
    const img = remoteImage(typeof src === "string" ? src : null);
    if (!img) return null;
    return (
      // Imagen de contenido: el tamaño real lo da el archivo subido.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={img.src} alt={alt ?? ""} loading="lazy" className="my-8 w-full rounded-sm bg-muted" />
    );
  },
};

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}
