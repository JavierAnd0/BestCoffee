import { NextResponse } from "next/server";
import { operatorStorageTenant } from "@/lib/auth/operator-guard";
import { contentImagePrefix, deleteBlobWithin } from "@/lib/storage/blob-paths";

// Descarta imágenes de contenido subidas en una edición que se abandonó sin
// guardar (el navegador lo avisa con sendBeacon al cerrar o salir de la
// página, cuando ya no puede esperar a una acción de servidor). Solo borra
// dentro de content/<tienda>/ del operador; las cookies no viajan en un POST
// desde otro sitio (SameSite=Lax), así que nadie ajeno puede dispararlo.

const MAX_URLS = 20;

export async function POST(request: Request): Promise<NextResponse> {
  let urls: unknown;
  try {
    urls = ((await request.json()) as { urls?: unknown })?.urls;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  if (!Array.isArray(urls) || urls.length > MAX_URLS || !urls.every((u) => typeof u === "string")) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const tenantSlug = await operatorStorageTenant();
  if (!tenantSlug) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const prefix = contentImagePrefix(tenantSlug);
  await Promise.all((urls as string[]).map((url) => deleteBlobWithin(url, prefix)));
  return NextResponse.json({ ok: true });
}
