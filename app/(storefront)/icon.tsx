import { tenantIcon } from "@/lib/tenant-icon";

// Depende de la tienda del host: nunca se genera en el build.
export const dynamic = "force-dynamic";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return tenantIcon(64, 14);
}
