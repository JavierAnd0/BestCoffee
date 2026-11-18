/**
 * Coordenadas a partir de lo que el operador pega desde Google Maps: un enlace
 * largo, el texto "4.6443, -74.0628" o un enlace de búsqueda. Los enlaces
 * cortos (maps.app.goo.gl) no traen coordenadas: los resuelve el servidor
 * (lib/actions/maps.ts) y luego pasan por aquí.
 */

export type LatLng = { lat: number; lng: number };

const valid = (lat: number, lng: number): LatLng | null =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
    ? { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }
    : null;

const PAIR = /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;

export function parseMapsCoordinates(input: string): LatLng | null {
  const raw = input.trim();
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    /* se usa tal cual */
  }

  // 1) El punto exacto del lugar (!3d<lat>!4d<lng>) es más preciso que el centro del mapa.
  const place = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) {
    const v = valid(Number(place[1]), Number(place[2]));
    if (v) return v;
  }

  // 2) Parámetros con coordenadas: q, query, ll, center, destination, daddr, sll.
  try {
    const url = new URL(raw);
    for (const key of ["q", "query", "ll", "center", "destination", "daddr", "sll"]) {
      const m = url.searchParams.get(key)?.match(PAIR);
      if (m) {
        const v = valid(Number(m[1]), Number(m[2]));
        if (v) return v;
      }
    }
  } catch {
    /* no es una URL: puede ser el texto de las coordenadas */
  }

  // 3) El centro del mapa: /@<lat>,<lng>,<zoom>z
  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const v = valid(Number(at[1]), Number(at[2]));
    if (v) return v;
  }

  // 4) Texto suelto copiado de Maps: "4.6443, -74.0628".
  const pair = text.match(new RegExp(`^${PAIR.source}$`));
  if (pair) return valid(Number(pair[1]), Number(pair[2]));
  return null;
}

/** Enlace corto de compartir de Google Maps (hay que seguirlo para ver las coordenadas). */
export function isShortMapsLink(input: string): boolean {
  try {
    const u = new URL(input.trim());
    return u.protocol === "https:" && (u.hostname === "maps.app.goo.gl" || (u.hostname === "goo.gl" && u.pathname.startsWith("/maps")));
  } catch {
    return false;
  }
}

/** Solo se siguen redirecciones dentro de Google Maps. */
export function isGoogleMapsHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "maps.app.goo.gl" ||
    h === "goo.gl" ||
    h === "maps.google.com" ||
    h === "google.com" ||
    h === "www.google.com" ||
    /^(www\.)?google\.com\.[a-z]{2}$/.test(h) ||
    /^(www\.)?google\.[a-z]{2}$/.test(h)
  );
}
