"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Plus,
  Quote,
  Trash2,
  Unlink,
} from "lucide-react";
import { uploadContentImage } from "@/components/admin/image-upload-field";
import { Tooltip } from "@/components/ui/tooltip";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Mismo ritmo tipográfico que el artículo publicado (components/storefront/article-body). */
const PROSE =
  "min-h-[50vh] outline-none text-[17px] leading-[1.75] text-foreground/90 " +
  "[&_p]:my-5 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:leading-tight [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:text-foreground " +
  "[&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mt-9 [&_h3]:mb-2 [&_h3]:text-foreground " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1.5 [&_li_p]:my-0 [&_li]:marker:text-muted-foreground " +
  "[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground [&_blockquote]:pl-6 [&_blockquote]:font-display [&_blockquote]:text-2xl [&_blockquote]:leading-snug [&_blockquote]:text-foreground " +
  "[&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-[var(--accent)] " +
  "[&_hr]:my-10 [&_hr]:border-border [&_img]:my-8 [&_img]:w-full [&_img]:rounded-sm [&_img]:cursor-pointer [&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-offset-4 [&_img.ProseMirror-selectednode]:outline-[var(--accent)] " +
  "[&_.is-empty]:before:content-[attr(data-placeholder)] [&_.is-empty]:before:text-muted-foreground/60 [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:pointer-events-none " +
  "selection:bg-[var(--accent)]/20";

type BlockItem = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  run: (e: Editor, pickImage: () => void) => void;
};

const BLOCKS: BlockItem[] = [
  { id: "h2", label: "Subtítulo", hint: "Divide el artículo en partes", icon: Heading2, run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { id: "h3", label: "Subtítulo pequeño", hint: "Una parte dentro de otra", icon: Heading3, run: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { id: "ul", label: "Lista", hint: "Puntos sueltos", icon: List, run: (e) => e.chain().focus().toggleBulletList().run() },
  { id: "ol", label: "Lista numerada", hint: "Pasos en orden, como una receta", icon: ListOrdered, run: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: "quote", label: "Cita destacada", hint: "Una frase que quieres resaltar", icon: Quote, run: (e) => e.chain().focus().setBlockquote().run() },
  { id: "img", label: "Imagen", hint: "Sube una foto (también puedes pegarla o arrastrarla)", icon: ImagePlus, run: (_e, pick) => pick() },
  { id: "hr", label: "Separador", hint: "Una línea para cambiar de tema", icon: Minus, run: (e) => e.chain().focus().setHorizontalRule().run() },
];

export function RichText({
  initialMarkdown,
  onChange,
  onImageUploaded,
  onSaveShortcut,
}: {
  initialMarkdown: string;
  onChange: (markdown: string, words: number) => void;
  /** URL recién subida (aún sin guardar): el editor la limpia si no se guarda. */
  onImageUploaded: (url: string) => void;
  /** Cmd/Ctrl + S dentro del texto. */
  onSaveShortcut: () => void;
}) {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Menú de bloques ("+" o "/"): su estado vive en refs para que los atajos de
  // teclado del editor (definidos una sola vez) lo lean al día.
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const menuRef = useRef({ open: false, index: 0 });
  const saveRef = useRef(onSaveShortcut);
  const pickImage = () => fileRef.current?.click();

  const editorRef = useRef<Editor | null>(null);

  async function insertImages(files: File[], pos?: number) {
    const editor = editorRef.current;
    const images = files.filter((f) => IMAGE_TYPES.includes(f.type));
    if (!editor || images.length === 0) return false;
    setUploadError(null);
    setUploading((n) => n + images.length);
    for (const file of images) {
      try {
        const url = await uploadContentImage("blog", file);
        onImageUploaded(url);
        const node = { type: "image", attrs: { src: url, alt: "" } };
        if (pos !== undefined) editor.chain().focus().insertContentAt(pos, node).run();
        else editor.chain().focus().insertContent(node).run();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return true;
  }
  const insertRef = useRef(insertImages);

  // Para el atajo Enter del menú: abre el selector de archivos.
  const fileInputClick = () => fileRef.current?.click();

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuIndex(0);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        showOnlyCurrent: true,
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "Subtítulo"
            : "Escribe aquí, o pulsa / para insertar un subtítulo, una imagen, una lista…",
      }),
      Markdown,
    ],
    content: initialMarkdown,
    contentType: "markdown",
    editorProps: {
      attributes: { class: PROSE, "aria-label": "Texto del artículo" },
      handleKeyDown: (view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          saveRef.current();
          return true;
        }
        const m = menuRef.current;
        if (m.open) {
          const n = BLOCKS.length;
          if (event.key === "ArrowDown") {
            setMenuIndex((m.index + 1) % n);
            return true;
          }
          if (event.key === "ArrowUp") {
            setMenuIndex((m.index - 1 + n) % n);
            return true;
          }
          if (event.key === "Enter") {
            const e = editorRef.current;
            if (e) BLOCKS[m.index].run(e, () => fileInputClick());
            closeMenu();
            return true;
          }
          closeMenu();
          if (event.key === "Escape") return true;
        }
        // "/" en una línea vacía abre el menú de bloques, como en Notion o Ghost.
        const { $from, empty } = view.state.selection;
        if (event.key === "/" && empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0) {
          setMenuOpen(true);
          setMenuIndex(0);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (!files.some((f) => IMAGE_TYPES.includes(f.type))) return false;
        void insertRef.current(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.some((f) => IMAGE_TYPES.includes(f.type))) return false;
        event.preventDefault();
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void insertRef.current(files, at?.pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown(), countWords(e.getText())),
    onCreate: ({ editor: e }) => onChange(e.getMarkdown(), countWords(e.getText())),
    onBlur: () => closeMenu(),
  });
  // Los atajos del editor se definen una vez: leen el estado actual por refs.
  useLayoutEffect(() => {
    editorRef.current = editor;
    menuRef.current = { open: menuOpen, index: menuIndex };
    saveRef.current = onSaveShortcut;
    insertRef.current = insertImages;
  });

  if (!editor) return <div className="min-h-[50vh]" aria-busy />;

  return (
    <div>
      <Toolbar editor={editor} onPickImage={() => fileRef.current?.click()} uploading={uploading > 0} />
      {uploadError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {uploadError}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void insertImages(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <FloatingMenu
        editor={editor}
        shouldShow={({ editor: e, state }) => {
          const { $from, empty } = state.selection;
          return e.isFocused && empty && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;
        }}
        options={{ placement: "left-start", offset: 12 }}
        className="relative"
      >
        <Tooltip content="Insertar un bloque">
          <button
            type="button"
            aria-label="Insertar un bloque"
            aria-expanded={menuOpen}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            className={
              "grid size-7 place-items-center rounded-full border transition-[transform,colors] duration-200 " +
              (menuOpen
                ? "rotate-45 border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
            }
          >
            <Plus className="size-4" />
          </button>
        </Tooltip>
        {menuOpen && (
          <div
            role="listbox"
            aria-label="Bloques"
            className="absolute left-10 top-0 z-30 w-72 rounded-lg border border-border bg-background p-1.5 shadow-lg"
          >
            {BLOCKS.map((it, i) => (
              <button
                key={it.id}
                type="button"
                role="option"
                aria-selected={i === menuIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setMenuIndex(i)}
                onClick={() => {
                  it.run(editor, pickImage);
                  closeMenu();
                }}
                className={
                  "flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-colors " +
                  (i === menuIndex ? "bg-muted" : "")
                }
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background">
                  <it.icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{it.label}</span>
                  <span className="block text-xs text-muted-foreground">{it.hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </FloatingMenu>

      <InlineMenu editor={editor} />
      <ImageMenu editor={editor} />
      <EditorContent editor={editor} className="pt-6" />
    </div>
  );
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Barra fija con los bloques: lo que un dueño de cafetería necesita, nada más. */
function Toolbar({ editor, onPickImage, uploading }: { editor: Editor; onPickImage: () => void; uploading: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
    }),
  });

  const c = () => editor.chain().focus();
  return (
    <div className="sticky top-[57px] z-20 -mx-2 border-b border-border bg-background px-2 py-2">
      <div role="toolbar" aria-label="Formato del texto" className="flex flex-wrap items-center gap-0.5">
        <Tool label="Subtítulo" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()} icon={Heading2} text="Subtítulo" />
        <Tool label="Subtítulo pequeño" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()} icon={Heading3} />
        <Sep />
        <Tool label="Negrilla" shortcut="⌘ B" active={s.bold} onClick={() => c().toggleBold().run()} icon={Bold} />
        <Tool label="Cursiva" shortcut="⌘ I" active={s.italic} onClick={() => c().toggleItalic().run()} icon={Italic} />
        <Sep />
        <Tool label="Lista" active={s.bullet} onClick={() => c().toggleBulletList().run()} icon={List} />
        <Tool label="Lista numerada" active={s.ordered} onClick={() => c().toggleOrderedList().run()} icon={ListOrdered} />
        <Tool label="Cita destacada" active={s.quote} onClick={() => c().toggleBlockquote().run()} icon={Quote} />
        <Tool label="Separador" onClick={() => c().setHorizontalRule().run()} icon={Minus} />
        <Sep />
        <Tool
          label="Insertar imagen"
          onClick={onPickImage}
          icon={uploading ? Loader2 : ImagePlus}
          spin={uploading}
          text={uploading ? "Subiendo…" : "Imagen"}
          disabled={uploading}
        />
        <span className="ml-auto hidden text-xs text-muted-foreground xl:inline">
          Pulsa <kbd className="rounded border border-border px-1 font-sans">/</kbd> en una línea vacía para insertar
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function Tool({
  label,
  icon: Icon,
  onClick,
  active,
  text,
  spin,
  disabled,
  shortcut,
}: {
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  text?: string;
  spin?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm transition-colors disabled:opacity-60 " +
        (active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")
      }
    >
      <Icon className={"size-4" + (spin ? " animate-spin" : "")} />
      {text && <span className="hidden sm:inline">{text}</span>}
    </button>
    </Tooltip>
  );
}

/** Al seleccionar texto: negrilla, cursiva y enlace, como en Ghost o Medium. */
function InlineMenu({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
    }),
  });

  useEffect(() => {
    if (linking) inputRef.current?.focus();
  }, [linking]);

  const applyLink = () => {
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href: /^(https?:|mailto:|\/)/.test(href) ? href : `https://${href}` }).run();
    else chain.unsetLink().run();
    setLinking(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => !state.selection.empty && !e.isActive("image")}
      className="flex items-center gap-0.5 rounded-md border border-border bg-background p-1 shadow-md"
    >
      {linking ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
          className="flex items-center gap-1"
        >
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setLinking(false)}
            placeholder="Pega el enlace y pulsa Enter"
            className="h-8 w-64 rounded-sm bg-transparent px-2 text-sm outline-none"
          />
        </form>
      ) : (
        <>
          <Tool label="Negrilla" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} />
          <Tool label="Cursiva" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} />
          <Tool
            label={s.link ? "Editar enlace" : "Agregar enlace"}
            active={s.link}
            onClick={() => {
              setUrl(s.href);
              setLinking(true);
            }}
            icon={Link2}
          />
          {s.link && (
            <Tool
              label="Quitar enlace"
              onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
              icon={Unlink}
            />
          )}
        </>
      )}
    </BubbleMenu>
  );
}

/** Al tocar una imagen: describirla (Google y lectores de pantalla) o quitarla. */
function ImageMenu({ editor }: { editor: Editor }) {
  const alt = useEditorState({
    editor,
    selector: ({ editor: e }) => (e.isActive("image") ? ((e.getAttributes("image").alt as string) ?? "") : null),
  });
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageMenu"
      shouldShow={({ editor: e }) => e.isActive("image")}
      options={{ placement: "bottom" }}
      className="flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
    >
      <input
        value={alt ?? ""}
        onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
        placeholder="Describe la imagen (ayuda en Google)"
        aria-label="Descripción de la imagen"
        className="h-8 w-72 rounded-sm bg-transparent px-2 text-sm outline-none"
      />
      <Tool label="Quitar imagen" onClick={() => editor.chain().focus().deleteSelection().run()} icon={Trash2} />
    </BubbleMenu>
  );
}
