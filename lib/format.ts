// Format COP centavos as "$58.000".
const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(cents: number): string {
  return COP.format(cents / 100);
}

/**
 * Formatea un ID de orden largo (ej. CUID de base de datos) a un código de pedido
 * legible, limpio y profesional: 'cmvldwedp0001rbv5sj0k69kl' -> 'BC-69KL'.
 */
export function formatOrderCode(id: string): string {
  if (!id) return "—";
  if (id.startsWith("ORG-") || id.startsWith("BC-")) return id;
  if (id.length > 10) {
    return `BC-${id.slice(-6).toUpperCase()}`;
  }
  return id;
}
