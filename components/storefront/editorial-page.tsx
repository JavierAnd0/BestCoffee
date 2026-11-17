import Image from "next/image";
import { remoteImage } from "@/lib/remote-image";
import type { PageSection } from "@/lib/editorial-pages";

// Piezas compartidas por las páginas editoriales de la tienda (historia,
// impacto, sostenibilidad, mayoristas). El texto lo escribe la tienda en su
// panel en texto plano: línea en blanco = párrafo nuevo, "- " al inicio de
// línea = elemento de lista, **así** = negrita. Nunca se interpreta HTML.

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

export function parseBlocks(body: string | undefined): Block[] {
  if (!body?.trim()) return [];
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.every((l) => l.startsWith("- "))) {
        return { kind: "ul", items: lines.map((l) => l.slice(2).trim()) };
      }
      return { kind: "p", text: lines.join(" ") };
    });
}

/** `**negrita**` → <strong>; el resto, texto tal cual. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-display">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const paragraphClass = "text-base text-foreground/90 leading-relaxed";

/** Párrafos y listas de un texto de la tienda. `leadFirst`: primer párrafo destacado. */
export function EditorialText({
  body,
  leadFirst = false,
  className = paragraphClass,
}: {
  body?: string;
  leadFirst?: boolean;
  className?: string;
}) {
  return (
    <>
      {parseBlocks(body).map((block, i) =>
        block.kind === "ul" ? (
          <ul key={i} className="space-y-4 text-base text-foreground/90 leading-relaxed">
            {block.items.map((item, j) => (
              <li key={j}>
                <InlineText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className={leadFirst && i === 0 ? "font-display text-xl leading-relaxed" : className}>
            <InlineText text={block.text} />
          </p>
        ),
      )}
    </>
  );
}

/** Imagen escrita en el panel (URL libre o ruta local), con la política de remoteImage. */
export function PageImage({
  url,
  alt,
  sizes,
  priority,
  className,
}: {
  url?: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const img = remoteImage(url);
  if (!img) return null;
  return (
    <Image
      src={img.src}
      unoptimized={img.unoptimized}
      alt={alt ?? ""}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

/** Foto dentro del cuerpo de una página (después del texto de la sección). */
export function SectionFigure({ section }: { section: PageSection }) {
  if (!remoteImage(section.imageUrl)) return null;
  return (
    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden my-8 shadow-md border border-border">
      <PageImage
        url={section.imageUrl}
        alt={section.imageAlt}
        sizes="(min-width: 768px) 700px, 100vw"
        className="object-cover hover:scale-[1.02] transition-transform duration-700 ease-out"
      />
    </div>
  );
}
