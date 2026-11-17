// Etiquetas de caché del front por tienda. La API revalida con etiquetas sin
// tienda (`locations`, `brew-guide:<slug>`…) y manda el slug aparte; aquí se
// combinan para que editar una tienda no invalide la caché de las demás.
// Convención compartida con el backend: src/modules/revalidation.

export function tenantCacheTag(tenantSlug: string, tag: string): string {
  return `t:${tenantSlug}:${tag}`;
}
