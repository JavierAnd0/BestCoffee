import { ImageResponse } from "next/og";
import { getCurrentTenant } from "@/lib/data/tenant";

// Ícono de la pestaña y de "agregar a inicio" de cada tienda: la inicial de su
// marca sobre su color de acento. Un logo rectangular no se lee a 16 px, así
// que no se usa aquí.

const DEFAULT_ACCENT = "#b85c32";
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function initial(brand: string): string {
  const ch = brand.normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]/i)?.[0];
  return (ch ?? "·").toUpperCase();
}

export async function tenantIcon(px: number, radius: number): Promise<ImageResponse> {
  const tenant = await getCurrentTenant();
  const accent = tenant.branding.accent && HEX.test(tenant.branding.accent) ? tenant.branding.accent : DEFAULT_ACCENT;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          borderRadius: radius,
          color: "#ffffff",
          fontSize: Math.round(px * 0.62),
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {initial(tenant.brand)}
      </div>
    ),
    { width: px, height: px },
  );
}
