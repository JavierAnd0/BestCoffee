import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { operatorStorageTenant } from "@/lib/auth/operator-guard";
import { IMAGE_CONTENT_TYPES, isAllowedUploadPath } from "@/lib/storage/blob-paths";
import { NextResponse } from "next/server";

// Emite tokens para que el navegador suba imágenes directo a Vercel Blob (sin
// pasar el archivo por esta función → sin límite de 4.5 MB): galería de
// productos (products/<tienda>/…) y contenido (content/<tienda>/<blog|guides|pages>/…).
// Requiere BLOB_READ_WRITE_TOKEN en el entorno.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // Autorización ANTES de tocar Vercel Blob: sin operador de esta tienda o con
  // una ruta fuera de sus carpetas no se llega a pedir ningún token.
  if (body?.type === "blob.generate-client-token") {
    const tenantSlug = await operatorStorageTenant();
    if (!tenantSlug) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const pathname = (body.payload as { pathname?: unknown } | undefined)?.pathname;
    if (typeof pathname !== "string" || !isAllowedUploadPath(pathname, tenantSlug)) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 403 });
    }
  }

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Solo un operador REAL puede subir: la cookie no basta (se escribe a mano),
        // el token se comprueba contra el backend.
        // Solo un operador REAL de esta tienda puede subir, y solo dentro de la
        // carpeta de su tienda: el backend confirma la membresía.
        const tenantSlug = await operatorStorageTenant();
        if (!tenantSlug) throw new Error("No autorizado");
        if (!isAllowedUploadPath(pathname, tenantSlug)) throw new Error("Ruta inválida");

        return {
          allowedContentTypes: IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // El front registra la imagen en la API tras recibir la URL, así que no
      // dependemos de este webhook (que además no llega a localhost).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir" },
      { status: 400 },
    );
  }
}

