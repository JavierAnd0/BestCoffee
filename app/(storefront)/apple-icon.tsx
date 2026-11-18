import { tenantIcon } from "@/lib/tenant-icon";

// iOS redondea las esquinas por su cuenta: el ícono va cuadrado.
export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return tenantIcon(180, 0);
}
