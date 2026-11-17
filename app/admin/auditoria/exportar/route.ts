import { NextResponse, type NextRequest } from "next/server";
import { auditRowsToCsv, listAllAuditRows, parseAuditFilters } from "@/lib/data/admin-audit";

// Descarga CSV de la bitácora filtrada. Consulta la API con la sesión del operador
// (la API exige rol TENANT_OWNER y la tienda del host): sin permiso, no hay datos.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseAuditFilters(Object.fromEntries(req.nextUrl.searchParams));
  const result = await listAllAuditRows(filters);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status === 503 ? 503 : result.status >= 400 ? result.status : 502 },
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(auditRowsToCsv(result.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${stamp}.csv"`,
      "Cache-Control": "no-store",
      ...(result.truncated && { "X-Export-Truncated": "true" }),
    },
  });
}
