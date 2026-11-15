import { ImageResponse } from "next/og";
import { getCurrentTenant } from "@/lib/data/tenant";

// Imagen que se muestra al compartir cualquier página de la tienda (WhatsApp,
// redes, buscadores). Se genera con la marca de cada tienda.
// Depende de la tienda del host: nunca se genera en el build.
export const dynamic = "force-dynamic";
export const alt = "Café de especialidad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const tenant = await getCurrentTenant();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "#fbf6ee",
          background:
            "radial-gradient(ellipse 85% 75% at 70% 45%, #4a2010 0%, #1c0904 55%, #0d0401 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#e09f67",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#b85c32" }} />
          Café de especialidad · Colombia
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 128, fontWeight: 300, letterSpacing: -3, lineHeight: 1 }}>
            {tenant.brand}
          </div>
          <div style={{ fontSize: 40, color: "#e8b888", fontStyle: "italic" }}>
            Seleccionado grano a grano.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(244, 232, 217, 0.72)",
            borderTop: "1px solid rgba(247, 239, 228, 0.18)",
            paddingTop: 28,
          }}
        >
          {tenant.tagline} · Tostado en lotes pequeños, enviado fresco
        </div>
      </div>
    ),
    size,
  );
}
