import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Emite tokens para que el navegador suba imágenes de producto directo a
// Vercel Blob (sin pasar el archivo por esta función → sin límite de 4.5 MB).
// Requiere BLOB_READ_WRITE_TOKEN en el entorno.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Solo operadores autenticados del panel pueden subir.
        const c = await cookies();
        const session =
          c.get("bestcoffee-impersonation")?.value ??
          c.get("bestcoffee-operator-session")?.value;
        if (!session) throw new Error("No autorizado");
        if (!pathname.startsWith("products/")) throw new Error("Ruta inválida");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
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

