"use server";

import { operatorStorageTenant } from "../auth/operator-guard";
import { isGoogleMapsHost, isShortMapsLink, parseMapsCoordinates, type LatLng } from "../maps-link";

type Result = { ok: true; data: LatLng } | { ok: false; error: string };

/**
 * Sigue un enlace corto de Google Maps (maps.app.goo.gl) hasta la URL larga y
 * saca las coordenadas. Solo para operadores, solo enlaces de Google Maps y sin
 * descargar la página: se leen las cabeceras de redirección.
 */
export async function resolveMapsLinkAction(link: string): Promise<Result> {
  if (!(await operatorStorageTenant())) return { ok: false, error: "No tienes permiso." };
  if (typeof link !== "string" || !isShortMapsLink(link)) {
    return { ok: false, error: "Ese no parece un enlace de Google Maps." };
  }

  let current = link.trim();
  for (let hop = 0; hop < 5; hop++) {
    const found = parseMapsCoordinates(current);
    if (found) return { ok: true, data: found };

    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000), cache: "no-store" });
    } catch {
      return { ok: false, error: "No pudimos abrir el enlace. Copia el enlace largo desde la barra del navegador." };
    }
    const location = res.headers.get("location");
    if (!location) break;
    const next = new URL(location, current);
    if (next.protocol !== "https:" || !isGoogleMapsHost(next.hostname)) break;
    current = next.toString();
  }

  const found = parseMapsCoordinates(current);
  return found
    ? { ok: true, data: found }
    : {
        ok: false,
        error: "El enlace no trae la ubicación exacta. En Google Maps, haz clic derecho sobre el lugar y copia las coordenadas.",
      };
}
