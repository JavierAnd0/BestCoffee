/**
 * Destino tras iniciar sesión: solo rutas internas de la propia tienda.
 * Rechaza URLs absolutas, `//host`, `/\host` y caracteres de control, que el
 * navegador podría interpretar como otro origen.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/cuenta"): string {
  if (!value || typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(v)) return fallback;
  try {
    // Resolver contra un origen ficticio: si cambia de origen, no es interna.
    const u = new URL(v, "http://interno.invalid");
    if (u.origin !== "http://interno.invalid") return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}
