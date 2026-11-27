import type { Metadata } from "next";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  AUDIT_ACTIONS,
  auditFiltersToSearch,
  listAuditPage,
  parseAuditFilters,
  type AuditFilters,
} from "@/lib/data/admin-audit";

export const metadata: Metadata = { title: "Auditoría · Admin" };

// Entidad = segmento de la ruta de la API que se modificó (/v1/admin/<entidad>/…).
const ENTITIES: { label: string; value?: string }[] = [
  { label: "Todas" },
  { label: "Productos", value: "products" },
  { label: "Pedidos", value: "orders" },
  { label: "Colecciones", value: "collections" },
  { label: "Cupones", value: "discount-codes" },
  { label: "Reseñas", value: "reviews" },
  { label: "Suscripciones", value: "subscriptions" },
  { label: "Contenido", value: "content" },
  { label: "Configuración", value: "settings" },
];

const ACTION_LABEL: Record<string, string> = {
  POST: "Creó",
  PATCH: "Editó",
  PUT: "Reemplazó",
  DELETE: "Eliminó",
};

const FIELD =
  "rounded-md border border-input bg-background px-3 h-9 text-sm outline-none focus-visible:border-foreground/40";

function href(filters: AuditFilters, extra?: Record<string, string>): string {
  const p = auditFiltersToSearch(filters);
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v);
  const qs = p.toString();
  return qs ? `/admin/auditoria?${qs}` : "/admin/auditoria";
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseAuditFilters(sp);
  const cursor = typeof sp.desdeId === "string" ? sp.desdeId : undefined;
  const page = await listAuditPage(filters, cursor);
  const exportQs = auditFiltersToSearch(filters).toString();
  const hasFilters = Object.keys(filters).length > 0;
  const knownEntity = ENTITIES.some((e) => e.value === filters.entity);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de auditoría"
        description="Cada creación, edición o borrado hecho desde el panel queda registrado con quién y cuándo."
        actions={
          <a
            href={`/admin/auditoria/exportar${exportQs ? `?${exportQs}` : ""}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium hover:bg-muted transition-colors"
            download
          >
            <Download className="size-3.5" />
            Exportar CSV
          </a>
        }
      />

      <div className="flex flex-wrap gap-2 text-xs">
        {ENTITIES.map((t) => {
          const active = t.value ? filters.entity === t.value : !filters.entity;
          return (
            <Link
              key={t.label}
              href={href({ ...filters, entity: t.value })}
              className={
                "rounded-md px-3 py-1.5 transition-colors " +
                (active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </Link>
          );
        })}
        {filters.entity && !knownEntity && (
          <span className="rounded-md px-3 py-1.5 bg-foreground text-background">{filters.entity}</span>
        )}
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        {filters.entity && <input type="hidden" name="entidad" value={filters.entity} />}
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">ID del registro afectado</span>
          <span className="relative block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              name="id"
              defaultValue={filters.entityId}
              placeholder="ID exacto"
              className={`${FIELD} pl-8 w-56 font-mono`}
            />
          </span>
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Acción</span>
          <select name="accion" defaultValue={filters.action ?? ""} className={FIELD}>
            <option value="">Todas</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Desde</span>
          <input type="date" name="desde" defaultValue={filters.from} className={FIELD} />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Hasta</span>
          <input type="date" name="hasta" defaultValue={filters.to} className={FIELD} />
        </label>
        <button
          type="submit"
          className="h-9 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/85"
        >
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/admin/auditoria" className="h-9 inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
            Quitar filtros
          </Link>
        )}
      </form>

      {!page.ok ? (
        <div className="rounded-md border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800">
          {page.status === 403
            ? "Solo el propietario de la tienda puede ver el registro de auditoría."
            : `No se pudo cargar el registro: ${page.error}`}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-th bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">Cuándo</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Entidad</th>
                <th className="px-4 py-3 font-medium">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {page.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {hasFilters || cursor
                      ? "No hay registros con estos filtros."
                      : "Todavía no hay acciones registradas en el panel."}
                  </td>
                </tr>
              ) : (
                page.rows.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatWhen(e.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{e.actorName || e.actorEmail || "Usuario eliminado"}</div>
                      {e.actorName && e.actorEmail && (
                        <div className="text-xs text-muted-foreground">{e.actorEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{ACTION_LABEL[e.action] ?? e.action}</td>
                    <td className="px-4 py-3">
                      <Link href={href({ ...filters, entity: e.entity })}>
                        <Badge variant="outline" className="font-normal">
                          {ENTITIES.find((x) => x.value === e.entity)?.label ?? e.entity}
                        </Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {e.entityId === "unknown" ? (
                        "—"
                      ) : (
                        <Link href={href({ ...filters, entityId: e.entityId })} className="hover:text-foreground">
                          {e.entityId}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {page.ok && (cursor || page.nextCursor) && (
        <div className="flex items-center justify-between text-xs">
          {cursor ? (
            <Link href={href(filters)} className="text-muted-foreground hover:text-foreground">
              ← Volver a los más recientes
            </Link>
          ) : (
            <span />
          )}
          {page.nextCursor && (
            <Link
              href={href(filters, { desdeId: page.nextCursor })}
              className="text-muted-foreground hover:text-foreground"
            >
              Más antiguos →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
