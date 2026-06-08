// Format COP centavos as "$58.000".
const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(cents: number): string {
  return COP.format(cents / 100);
}
