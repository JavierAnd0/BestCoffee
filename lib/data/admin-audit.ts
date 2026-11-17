// Bitácora de auditoría del panel (API: /v1/admin/audit-logs, rol TENANT_OWNER).
// La usan la página /admin/auditoria y su exportación CSV.

import { env } from "../env";
import { operatorFetch } from "../api/gateway";

export interface AuditFilters {
  entity?: string;
  action?: string;
  entityId?: string;
  /** Fecha AAAA-MM-DD (inclusive, desde el inicio del día). */
  from?: string;
  /** Fecha AAAA-MM-DD (inclusive, hasta el final del día). */
  to?: string;
}

export interface AuditRow {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  actorEmail: string | null;
  actorName: string | null;
  diff: unknown;
}

interface ApiAuditRow {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  diff?: unknown;
  actor?: { email?: string | null; name?: string | null } | null;
}

export const AUDIT_ACTIONS = ["POST", "PATCH", "PUT", "DELETE"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_RE = /^[A-Za-z0-9_.:-]{1,80}$/;

/** Normaliza filtros que llegan de la URL: lo que no es válido se descarta. */
export function parseAuditFilters(
  sp: Record<string, string | string[] | undefined>,
): AuditFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  const entity = one("entidad");
  const action = one("accion").toUpperCase();
  const entityId = one("id");
  const from = one("desde");
  const to = one("hasta");
  return {
    ...(TOKEN_RE.test(entity) && { entity }),
    ...((AUDIT_ACTIONS as readonly string[]).includes(action) && { action }),
    ...(TOKEN_RE.test(entityId) && { entityId }),
    ...(DATE_RE.test(from) && { from }),
    ...(DATE_RE.test(to) && { to }),
  };
}

/** Parámetros de URL del panel para unos filtros (para enlaces y exportación). */
export function auditFiltersToSearch(f: AuditFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.entity) p.set("entidad", f.entity);
  if (f.action) p.set("accion", f.action);
  if (f.entityId) p.set("id", f.entityId);
  if (f.from) p.set("desde", f.from);
  if (f.to) p.set("hasta", f.to);
  return p;
}

function toApiQuery(f: AuditFilters, cursor?: string, limit = 25): string {
  const p = new URLSearchParams({ limit: String(limit) });
  if (f.entity) p.set("entity", f.entity);
  if (f.action) p.set("action", f.action);
  if (f.entityId) p.set("entityId", f.entityId);
  // Fechas del día completo en hora de Colombia (UTC-5, sin horario de verano).
  if (f.from) p.set("from", new Date(`${f.from}T00:00:00-05:00`).toISOString());
  if (f.to) p.set("to", new Date(`${f.to}T23:59:59.999-05:00`).toISOString());
  if (cursor) p.set("cursor", cursor);
  return p.toString();
}

function mapRow(r: ApiAuditRow): AuditRow {
  return {
    id: r.id,
    createdAt: r.createdAt,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    actorEmail: r.actor?.email ?? null,
    actorName: r.actor?.name ?? null,
    diff: r.diff ?? null,
  };
}

export type AuditPage =
  | { ok: true; rows: AuditRow[]; nextCursor: string | null }
  | { ok: false; status: number; error: string };

export async function listAuditPage(
  filters: AuditFilters,
  cursor?: string,
  limit = 25,
): Promise<AuditPage> {
  if (env.useMocks) return { ok: true, rows: [], nextCursor: null };
  const safeCursor = cursor && TOKEN_RE.test(cursor) ? cursor : undefined;
  const res = await operatorFetch<{ items: ApiAuditRow[]; nextCursor: string | null }>(
    `/v1/admin/audit-logs?${toApiQuery(filters, safeCursor, limit)}`,
  );
  if (!res.ok) return { ok: false, status: res.status, error: res.error };
  return {
    ok: true,
    rows: (res.data?.items ?? []).map(mapRow),
    nextCursor: res.data?.nextCursor ?? null,
  };
}

/** Todas las filas filtradas (paginando), con un tope para no colgar la exportación. */
export async function listAllAuditRows(
  filters: AuditFilters,
  maxRows = 10_000,
): Promise<{ ok: true; rows: AuditRow[]; truncated: boolean } | { ok: false; status: number; error: string }> {
  const rows: AuditRow[] = [];
  let cursor: string | undefined;
  while (rows.length < maxRows) {
    const page = await listAuditPage(filters, cursor, 100);
    if (!page.ok) return page;
    rows.push(...page.rows);
    if (!page.nextCursor) return { ok: true, rows, truncated: false };
    cursor = page.nextCursor;
  }
  return { ok: true, rows: rows.slice(0, maxRows), truncated: true };
}

/**
 * Celda CSV segura: entre comillas, con comillas dobladas, y con un apóstrofo
 * delante si empieza por un carácter que Excel/Sheets interpretan como fórmula.
 */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function auditRowsToCsv(rows: AuditRow[]): string {
  const header = ["Fecha (UTC)", "Correo", "Nombre", "Acción", "Entidad", "ID entidad", "Cambios"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.createdAt, r.actorEmail, r.actorName, r.action, r.entity, r.entityId, r.diff]
        .map(csvCell)
        .join(","),
    );
  }
  // BOM para que Excel abra el UTF-8 con tildes correctas.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
