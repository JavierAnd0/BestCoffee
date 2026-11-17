import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import { tenantCacheTag } from "@/lib/data/cache-tags";

// Webhook de revalidación: la API lo llama tras cada cambio del panel
// (src/modules/revalidation del backend) con la cabecera `x-revalidate-secret`
// y el cuerpo `{ tenantSlug, tags }`. Invalida solo la caché de esa tienda.
//
// Solo se cachean datos (fetch con etiquetas en lib/data/static.ts); las
// páginas son dinámicas (leen la tienda de las cabeceras). No se usa
// revalidatePath: las rutas no llevan la tienda y vaciaría la caché de todas.

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
const TAG = /^[a-z0-9-]+(?::[a-z0-9-]+)?$/;

function secretMatches(received: string | null): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(env.revalidateSecret);
  // timingSafeEqual exige el mismo largo; comparar contra sí mismo mantiene el tiempo constante.
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ revalidated: false, error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ revalidated: false, error: "Cuerpo inválido" }, { status: 400 });
  }
  const { tenantSlug, tags } = (body ?? {}) as { tenantSlug?: unknown; tags?: unknown };
  if (
    typeof tenantSlug !== "string" ||
    !SLUG.test(tenantSlug) ||
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > 50 ||
    !tags.every((t): t is string => typeof t === "string" && t.length <= 200 && TAG.test(t))
  ) {
    return Response.json({ revalidated: false, error: "tenantSlug o tags inválidos" }, { status: 400 });
  }

  const unique = [...new Set(tags)];
  for (const tag of unique) {
    // `expire: 0`: el siguiente visitante ya ve el cambio (sin servir la copia vieja).
    revalidateTag(tenantCacheTag(tenantSlug, tag), { expire: 0 });
  }

  return Response.json({ revalidated: true, tenantSlug, tags: unique });
}
