"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "../env";
import { operatorFetch } from "../api/gateway";
import { getOperatorSession } from "../auth/session-store";
import { tenantCacheTag } from "../data/cache-tags";
import type { BrewDifficulty, ContentKind } from "../data/admin-content";
import { isContentPageSlug, type EditorialPageContent } from "../editorial-pages";
import { operatorStorageTenant } from "../auth/operator-guard";
import { contentImagePrefix, deleteBlobWithin } from "../storage/blob-paths";

// Acciones del panel para el contenido editorial: bloques de la home, blog,
// guías y sedes. El backend valida, aísla por tienda y avisa al front
// (app/api/revalidate); aquí además se invalida la caché de la propia tienda
// (etiquetas t:<tienda>:…) para que el cambio se vea al instante aunque el
// aviso no llegue. Blog e inicio se leen sin caché, no necesitan invalidarse.

export type ContentActionResult = { ok: true } | { ok: false; error: string };

const BASE = "/admin/contenido";

function text(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Fecha de un <input type="date"> o "datetime-local" → ISO; vacío → null. */
function isoOrNull(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function refreshStorefront(tags: string[]) {
  const { tenantSlug } = await getOperatorSession();
  for (const tag of tags) updateTag(tenantCacheTag(tenantSlug, tag));
}

async function send(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body: unknown,
  fallback: string,
): Promise<ContentActionResult & { data?: unknown }> {
  if (env.useMocks) return { ok: false, error: "El panel está en modo de ejemplo: no se guardan cambios." };
  const r = await operatorFetch(path, { method, body });
  if (!r.ok) {
    if (r.status === 402) return { ok: false, error: "Tu plan no incluye esta sección." };
    if (r.status === 404) return { ok: false, error: "No se encontró. Recarga la página." };
    return { ok: false, error: r.error || fallback };
  }
  return { ok: true, data: r.data };
}

// ── Imágenes que dejan de usarse ──────────────────────────────────────────────
// Al reemplazar o quitar una portada (o una imagen de página) y guardar, o al
// borrar el contenido, la imagen anterior se borra de Blob. Solo se tocan
// archivos de content/<tienda>/ (las URLs externas y /img/… se ignoran) y cada
// subida tiene sufijo aleatorio, así que ningún otro contenido comparte archivo.

/** URLs de imagen (`coverUrl` / `imageUrl`) en cualquier nivel del objeto. */
function imageUrls(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const v of value) imageUrls(v, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if ((k === "coverUrl" || k === "imageUrl") && typeof v === "string" && v) out.add(v);
      // El cuerpo del blog es Markdown: sus imágenes también son de la tienda
      // y no deben borrarse de Blob mientras sigan en el texto.
      else if (k === "body" && typeof v === "string") {
        for (const m of v.matchAll(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/g)) out.add(m[1]);
      } else imageUrls(v, out);
    }
  }
  return out;
}

/** Imágenes que tiene guardadas hoy un contenido (vacío si no se pudo leer). */
async function savedImages(path: string): Promise<Set<string>> {
  if (env.useMocks) return new Set();
  const r = await operatorFetch(path, { method: "GET" });
  return r.ok ? imageUrls(r.data) : new Set();
}

/** Borra de Blob las imágenes de `before` que ya no están en `after`. */
async function discardUnusedImages(before: Set<string>, after: unknown = null): Promise<void> {
  if (!before.size) return;
  const keep = imageUrls(after);
  const gone = [...before].filter((url) => !keep.has(url));
  if (!gone.length) return;
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug) return;
  const prefix = contentImagePrefix(tenantSlug);
  await Promise.all(gone.map((url) => deleteBlobWithin(url, prefix)));
}

// ── Bloques de la home (/v1/admin/content) ────────────────────────────────────

const KINDS: ContentKind[] = ["ANNOUNCEMENT", "HERO", "SPOTLIGHT", "FEATURED_BUNDLE"];

function cta(fd: FormData) {
  const label = text(fd, "ctaLabel");
  const href = text(fd, "ctaHref");
  if (!label && !href) return undefined;
  return { label, href };
}

function blockData(kind: ContentKind, fd: FormData): Record<string, unknown> | string {
  switch (kind) {
    case "ANNOUNCEMENT": {
      const t = text(fd, "text");
      if (!t) return "Escribe el texto del anuncio.";
      const c = cta(fd);
      if (c && (!c.label || !c.href)) return "El botón necesita texto y enlace.";
      return { text: t, ...(c && { cta: c }) };
    }
    case "HERO": {
      const title = text(fd, "title");
      const imageDesktop = text(fd, "imageDesktop");
      if (!title) return "Escribe el titular.";
      if (!imageDesktop) return "Agrega la imagen principal.";
      const c = cta(fd);
      if (c && (!c.label || !c.href)) return "El botón necesita texto y enlace.";
      const subtitle = text(fd, "subtitle");
      const imageMobile = text(fd, "imageMobile");
      return {
        title,
        imageDesktop,
        ...(subtitle && { subtitle }),
        ...(imageMobile && { imageMobile }),
        ...(c && { cta: c }),
      };
    }
    case "SPOTLIGHT": {
      const productSlug = text(fd, "productSlug");
      if (!productSlug) return "Elige el producto destacado.";
      const title = text(fd, "title");
      return { productSlug, ...(title && { title }) };
    }
    case "FEATURED_BUNDLE": {
      const title = text(fd, "title");
      const productSlugs = fd
        .getAll("productSlugs")
        .map((v) => String(v).trim())
        .filter(Boolean);
      if (!title) return "Escribe el título del paquete.";
      if (productSlugs.length === 0) return "Elige al menos un producto.";
      return { title, productSlugs };
    }
  }
}

export async function saveContentBlockAction(
  _prev: ContentActionResult | null,
  fd: FormData,
): Promise<ContentActionResult> {
  const id = text(fd, "id");
  const kind = text(fd, "kind") as ContentKind;
  if (!KINDS.includes(kind)) return { ok: false, error: "Tipo de bloque no válido." };

  const data = blockData(kind, fd);
  if (typeof data === "string") return { ok: false, error: data };

  const startsAt = isoOrNull(text(fd, "startsAt"));
  const endsAt = isoOrNull(text(fd, "endsAt"));
  if (startsAt && endsAt && startsAt > endsAt) {
    return { ok: false, error: "La fecha de inicio no puede ser posterior al fin." };
  }
  const position = Math.max(0, Math.trunc(Number(text(fd, "position") || 0)) || 0);
  const common = { data, active: fd.get("active") === "on", position };

  const r = id
    ? await send(
        `/v1/admin/content/${encodeURIComponent(id)}`,
        "PATCH",
        { ...common, startsAt, endsAt },
        "No se pudo guardar el bloque.",
      )
    : await send(
        "/v1/admin/content",
        "POST",
        { kind, ...common, ...(startsAt && { startsAt }), ...(endsAt && { endsAt }) },
        "No se pudo crear el bloque.",
      );
  if (!r.ok) return r;

  revalidatePath(BASE);
  redirect(BASE);
}

export async function toggleContentBlockAction(id: string, active: boolean): Promise<ContentActionResult> {
  const r = await send(
    `/v1/admin/content/${encodeURIComponent(id)}`,
    "PATCH",
    { active },
    "No se pudo cambiar el estado.",
  );
  if (!r.ok) return r;
  revalidatePath(BASE);
  return { ok: true };
}

export async function deleteContentBlockAction(id: string): Promise<ContentActionResult> {
  const r = await send(`/v1/admin/content/${encodeURIComponent(id)}`, "DELETE", undefined, "No se pudo borrar el bloque.");
  if (!r.ok) return r;
  revalidatePath(BASE);
  return { ok: true };
}

// ── Blog (/v1/admin/blog) ─────────────────────────────────────────────────────

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Resultado de guardar desde el editor: se queda en el editor con lo guardado. */
export type BlogSaveResult =
  | { ok: true; post: { id: string; slug: string; status: "DRAFT" | "SCHEDULED" | "PUBLISHED" }; at: number }
  | { ok: false; error: string };

export async function saveBlogPostAction(
  _prev: BlogSaveResult | null,
  fd: FormData,
): Promise<BlogSaveResult> {
  const id = text(fd, "id");
  const title = text(fd, "title");
  const slug = text(fd, "slug");
  const body = String(fd.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!title) return { ok: false, error: "Escribe el título." };
  if (!body) return { ok: false, error: "Escribe el texto del artículo." };
  if (slug && !SLUG.test(slug)) {
    return { ok: false, error: "La dirección solo admite minúsculas, números y guiones." };
  }
  const published = text(fd, "status") === "published";
  const publishedAt = published ? isoOrNull(text(fd, "publishedAt")) : null;

  const payload = {
    title,
    body,
    excerpt: text(fd, "excerpt"),
    coverUrl: text(fd, "coverUrl"),
    published,
    ...(slug && { slug }),
    ...(publishedAt && { publishedAt }),
  };

  const before = id ? await savedImages(`/v1/admin/blog/${encodeURIComponent(id)}`) : new Set<string>();
  const r = id
    ? await send(`/v1/admin/blog/${encodeURIComponent(id)}`, "PATCH", payload, "No se pudo guardar el artículo.")
    : await send("/v1/admin/blog", "POST", payload, "No se pudo crear el artículo.");
  if (!r.ok) return r;
  await discardUnusedImages(before, payload);

  const saved = (r.data ?? {}) as { id?: string; slug?: string; publishedAt?: string | null };
  await refreshStorefront(["blog", ...(saved.slug ? [`blog:${saved.slug}`] : [])]);
  revalidatePath(`${BASE}/blog`);
  const when = saved.publishedAt ?? publishedAt;
  const status = !published
    ? "DRAFT"
    : when && new Date(when).getTime() > Date.now()
      ? "SCHEDULED"
      : "PUBLISHED";
  return {
    ok: true,
    post: { id: saved.id ?? id, slug: saved.slug ?? slug, status },
    at: Date.now(),
  };
}

export async function setBlogPostPublishedAction(id: string, published: boolean): Promise<ContentActionResult> {
  const r = await send(
    `/v1/admin/blog/${encodeURIComponent(id)}/${published ? "publish" : "unpublish"}`,
    "POST",
    undefined,
    "No se pudo cambiar el estado del artículo.",
  );
  if (!r.ok) return r;
  const saved = r.data as { slug?: string } | undefined;
  await refreshStorefront(["blog", ...(saved?.slug ? [`blog:${saved.slug}`] : [])]);
  revalidatePath(`${BASE}/blog`);
  return { ok: true };
}

export async function deleteBlogPostAction(id: string): Promise<ContentActionResult> {
  const before = await savedImages(`/v1/admin/blog/${encodeURIComponent(id)}`);
  const r = await send(`/v1/admin/blog/${encodeURIComponent(id)}`, "DELETE", undefined, "No se pudo borrar el artículo.");
  if (!r.ok) return r;
  await discardUnusedImages(before);
  await refreshStorefront(["blog"]);
  revalidatePath(`${BASE}/blog`);
  return { ok: true };
}

// ── Guías de preparación (/v1/admin/brew-guides) ──────────────────────────────

const DIFFICULTIES: BrewDifficulty[] = ["Fácil", "Media", "Avanzada"];

interface StepInput {
  title: string;
  body: string;
  durationSec: number;
  waterG: number | null;
}

/** Número positivo de un campo libre, o null (dato no indicado). */
function positive(v: unknown, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.round(n * 10) / 10) : null;
}

function parseRecipe(raw: string) {
  let r: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) r = parsed as Record<string, unknown>;
  } catch {
    /* receta vacía */
  }
  return {
    coffeeG: positive(r.coffeeG, 2000),
    waterMl: positive(r.waterMl, 10000),
    tempC: positive(r.tempC, 100),
    grind: String(r.grind ?? "").trim().slice(0, 60),
  };
}

function parseSteps(raw: string): StepInput[] | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return "Los pasos no tienen un formato válido.";
  }
  if (!Array.isArray(parsed)) return "Los pasos no tienen un formato válido.";
  const steps: StepInput[] = [];
  for (const s of parsed as Record<string, unknown>[]) {
    const title = String(s?.title ?? "").trim();
    const body = String(s?.body ?? "").trim();
    const durationSec = Math.max(0, Math.round(Number(s?.durationSec) || 0));
    if (!title && !body) continue; // fila vacía
    if (!title) return "Cada paso necesita un título.";
    steps.push({ title, body, durationSec: Math.min(86400, durationSec), waterG: positive(s?.waterG, 5000) });
  }
  return steps;
}

export async function saveBrewGuideAction(
  _prev: ContentActionResult | null,
  fd: FormData,
): Promise<ContentActionResult> {
  const id = text(fd, "id");
  const title = text(fd, "title");
  const slug = text(fd, "slug");
  const difficulty = text(fd, "difficulty") as BrewDifficulty;
  if (!title) return { ok: false, error: "Escribe el título de la guía." };
  if (slug && !SLUG.test(slug)) {
    return { ok: false, error: "La dirección solo admite minúsculas, números y guiones." };
  }
  if (!DIFFICULTIES.includes(difficulty)) return { ok: false, error: "Elige la dificultad." };
  const steps = parseSteps(String(fd.get("steps") ?? "[]"));
  if (typeof steps === "string") return { ok: false, error: steps };

  const payload = {
    title,
    method: text(fd, "method"),
    summary: text(fd, "summary"),
    totalTime: text(fd, "totalTime"),
    difficulty,
    recipe: parseRecipe(String(fd.get("recipe") ?? "")),
    steps,
    coverUrl: text(fd, "coverUrl"),
    ...(slug && { slug }),
  };

  const before = id ? await savedImages(`/v1/admin/brew-guides/${encodeURIComponent(id)}`) : new Set<string>();
  const r = id
    ? await send(`/v1/admin/brew-guides/${encodeURIComponent(id)}`, "PATCH", payload, "No se pudo guardar la guía.")
    : await send("/v1/admin/brew-guides", "POST", payload, "No se pudo crear la guía.");
  if (!r.ok) return r;
  await discardUnusedImages(before, payload);

  const saved = r.data as { slug?: string } | undefined;
  await refreshStorefront(["brew-guides", ...(saved?.slug ? [`brew-guide:${saved.slug}`] : [])]);
  revalidatePath(`${BASE}/guias`);
  redirect(`${BASE}/guias`);
}

export async function deleteBrewGuideAction(id: string): Promise<ContentActionResult> {
  const before = await savedImages(`/v1/admin/brew-guides/${encodeURIComponent(id)}`);
  const r = await send(`/v1/admin/brew-guides/${encodeURIComponent(id)}`, "DELETE", undefined, "No se pudo borrar la guía.");
  if (!r.ok) return r;
  await discardUnusedImages(before);
  await refreshStorefront(["brew-guides"]);
  revalidatePath(`${BASE}/guias`);
  return { ok: true };
}

// ── Sedes (/v1/admin/locations) ───────────────────────────────────────────────

function coord(value: string, min: number, max: number): number | null | "invalid" {
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) return "invalid";
  return n;
}

export async function saveLocationAction(
  _prev: ContentActionResult | null,
  fd: FormData,
): Promise<ContentActionResult> {
  const id = text(fd, "id");
  const name = text(fd, "name");
  const address = text(fd, "address");
  const city = text(fd, "city");
  if (!name || !address || !city) {
    return { ok: false, error: "Nombre, dirección y ciudad son obligatorios." };
  }
  const lat = coord(text(fd, "lat"), -90, 90);
  const lng = coord(text(fd, "lng"), -180, 180);
  if (lat === "invalid" || lng === "invalid") {
    return { ok: false, error: "Latitud o longitud no válidas." };
  }
  if ((lat === null) !== (lng === null)) {
    return { ok: false, error: "Indica latitud y longitud juntas, o ninguna." };
  }

  const payload = {
    name,
    address,
    city,
    phone: text(fd, "phone") || null,
    hours: text(fd, "hours") || null,
    lat,
    lng,
  };

  const r = id
    ? await send(`/v1/admin/locations/${encodeURIComponent(id)}`, "PATCH", payload, "No se pudo guardar la sede.")
    : await send("/v1/admin/locations", "POST", payload, "No se pudo crear la sede.");
  if (!r.ok) return r;

  await refreshStorefront(["locations"]);
  revalidatePath(`${BASE}/sedes`);
  redirect(`${BASE}/sedes`);
}

export async function deleteLocationAction(id: string): Promise<ContentActionResult> {
  const r = await send(`/v1/admin/locations/${encodeURIComponent(id)}`, "DELETE", undefined, "No se pudo borrar la sede.");
  if (!r.ok) return r;
  await refreshStorefront(["locations"]);
  revalidatePath(`${BASE}/sedes`);
  return { ok: true };
}

// ── Páginas editoriales (/v1/admin/pages) ─────────────────────────────────────

const PAGE_SLUGS = ["historia", "impacto", "sostenibilidad", "mayoristas", "tiendas"];

/** Menús, sitemap y llms.txt leen las páginas activas del perfil de la tienda. */
async function refreshPage(slug: string) {
  await refreshStorefront(["settings", "pages", `page:${slug}`]);
  revalidatePath(`${BASE}/paginas`);
}

/** Quita textos vacíos (la API valida formato solo de lo que llega) y filas vacías. */
function pruneEmpty(value: unknown): unknown {
  if (typeof value === "string") return value.trim() ? value : undefined;
  if (Array.isArray(value)) {
    return value.map(pruneEmpty).filter((v) => v !== undefined && !(typeof v === "object" && v && !Object.keys(v).length));
  }
  if (value && typeof value === "object") {
    const out = Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => [k, pruneEmpty(v)] as const)
        .filter(([, v]) => v !== undefined),
    );
    return Object.keys(out).length ? out : undefined;
  }
  return value;
}

/**
 * Guarda el texto de una página. El formulario manda el contenido completo
 * como JSON en `content` (secciones y cifras son listas editables); la API lo
 * valida y lo sanea. `activate` = guardar y activar en un paso.
 */
export async function saveEditorialPageAction(
  _prev: ContentActionResult | null,
  fd: FormData,
): Promise<ContentActionResult> {
  const slug = text(fd, "slug");
  if (!isContentPageSlug(slug)) return { ok: false, error: "Página no válida." };
  let content: EditorialPageContent;
  try {
    content = JSON.parse(String(fd.get("content") ?? "")) as EditorialPageContent;
  } catch {
    return { ok: false, error: "El contenido no tiene un formato válido." };
  }
  if (!content || typeof content.title !== "string" || !content.title.trim()) {
    return { ok: false, error: "Escribe el título de la página." };
  }
  const activate = fd.get("activate") === "on";
  const cleaned = pruneEmpty(content) as EditorialPageContent;
  cleaned.sections ??= [];
  // Una cifra a medias no se puede mostrar.
  if (cleaned.highlights?.some((h) => !h.value || !h.label)) {
    return { ok: false, error: "Cada cifra necesita el dato y lo que mide." };
  }

  const before = await savedImages(`/v1/admin/pages/${slug}`);
  const r = await send(
    `/v1/admin/pages/${slug}`,
    "PUT",
    { content: cleaned, ...(activate && { active: true }) },
    "No se pudo guardar la página.",
  );
  if (!r.ok) return r;
  await discardUnusedImages(before, cleaned);
  await refreshPage(slug);
  redirect(`${BASE}/paginas`);
}

/** Activa o desactiva una página (la misma bandera que ve el superadmin). */
export async function setEditorialPageActiveAction(slug: string, active: boolean): Promise<ContentActionResult> {
  if (!PAGE_SLUGS.includes(slug)) return { ok: false, error: "Página no válida." };
  const r = await send(`/v1/admin/pages/${slug}`, "PUT", { active }, "No se pudo cambiar el estado de la página.");
  if (!r.ok) return r;
  await refreshPage(slug);
  return { ok: true };
}
