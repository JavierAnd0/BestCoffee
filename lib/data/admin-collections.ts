// Lecturas del panel para colecciones (API real: /v1/admin/collections).
// Las mutaciones viven en lib/actions/admin-collections.ts.

import { env } from "../env";
import { operatorFetch } from "../api/gateway";

export type CollectionKind = "MANUAL" | "AUTO";

/** Reglas de una colección AUTO, tal como las acepta `AutoRulesDto`. */
export interface CollectionRules {
  type?: "SINGLE_ORIGIN" | "BLEND" | "DECAF" | "ACCESSORY";
  roastLevelGte?: number;
  roastLevelLte?: number;
  flavorNote?: string;
  badge?: string;
}

export interface AdminCollectionSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: CollectionKind;
  position: number;
  rules: CollectionRules | null;
  /** Productos vinculados a mano (en las AUTO siempre es 0: se resuelven por reglas). */
  linkedCount: number;
}

export interface AdminCollectionDetail extends AdminCollectionSummary {
  products: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    position: number;
  }>;
}

interface ApiCollection {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  type: CollectionKind;
  position?: number;
  rules?: unknown;
  _count?: { products?: number };
  products?: Array<{
    position: number;
    product: { id: string; slug: string; name: string; status: string };
  }>;
}

function asRules(raw: unknown): CollectionRules | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: CollectionRules = {};
  if (typeof r.type === "string") out.type = r.type as CollectionRules["type"];
  if (typeof r.roastLevelGte === "number") out.roastLevelGte = r.roastLevelGte;
  if (typeof r.roastLevelLte === "number") out.roastLevelLte = r.roastLevelLte;
  if (typeof r.flavorNote === "string") out.flavorNote = r.flavorNote;
  if (typeof r.badge === "string") out.badge = r.badge;
  return Object.keys(out).length ? out : null;
}

function mapSummary(c: ApiCollection): AdminCollectionSummary {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? null,
    type: c.type,
    position: c.position ?? 0,
    rules: asRules(c.rules),
    linkedCount: c._count?.products ?? c.products?.length ?? 0,
  };
}

export type AdminCollectionsResult =
  | { ok: true; collections: AdminCollectionSummary[] }
  | { ok: false; error: string };

export async function listAdminCollections(): Promise<AdminCollectionsResult> {
  if (env.useMocks) return { ok: true, collections: [] };
  const res = await operatorFetch<ApiCollection[]>("/v1/admin/collections");
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, collections: (res.data ?? []).map(mapSummary) };
}

export async function getAdminCollection(id: string): Promise<AdminCollectionDetail | null> {
  if (env.useMocks) return null;
  const res = await operatorFetch<ApiCollection>(
    `/v1/admin/collections/${encodeURIComponent(id)}`,
  );
  if (!res.ok || !res.data) return null;
  const c = res.data;
  return {
    ...mapSummary(c),
    products: (c.products ?? []).map((p) => ({ ...p.product, position: p.position })),
  };
}

/** Texto legible de las reglas de una colección AUTO. */
export function describeRules(rules: CollectionRules | null): string[] {
  if (!rules) return [];
  const TYPE: Record<string, string> = {
    SINGLE_ORIGIN: "Origen único",
    BLEND: "Mezcla",
    DECAF: "Descafeinado",
    ACCESSORY: "Accesorio",
  };
  const out: string[] = [];
  if (rules.type) out.push(`Tipo = ${TYPE[rules.type] ?? rules.type}`);
  if (rules.roastLevelGte && rules.roastLevelLte) {
    out.push(`Tueste ${rules.roastLevelGte}–${rules.roastLevelLte}`);
  } else if (rules.roastLevelGte) {
    out.push(`Tueste ≥ ${rules.roastLevelGte}`);
  } else if (rules.roastLevelLte) {
    out.push(`Tueste ≤ ${rules.roastLevelLte}`);
  }
  if (rules.flavorNote) out.push(`Nota: ${rules.flavorNote}`);
  if (rules.badge) out.push(`Distintivo: ${rules.badge}`);
  return out;
}
