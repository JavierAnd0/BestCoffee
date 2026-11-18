import type { BrewRecipe } from "../brew";
import { env } from "../env";
import {
  STORE_LOCATIONS,
  BREW_GUIDES,
  findGuide as findGuideMock,
  type StoreLocation,
  type BrewGuide,
} from "../mocks/static";
import { getCurrentTenant } from "./tenant";
import { headers } from "next/headers";
import { tenantCacheTag } from "./cache-tags";
import { serverOriginHeaders } from "@/lib/api/client-ip";

async function tenantSlug(): Promise<string> {
  const h = await headers();
  return h.get("x-tenant-slug") ?? env.defaultTenantSlug;
}

// ── Store locations ───────────────────────────────────────────────────────────

interface ApiLocation {
  id?: string;
  slug?: string;
  name?: string;
  neighborhood?: string;
  address?: string;
  street?: string;
  city?: string;
  hours?: string;
  schedule?: string;
  openingHours?: string;
  phone?: string;
  phoneNumber?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  features?: string[];
  description?: string;
}

// Solo se muestra lo que la tienda cargó: sin datos de relleno (teléfono,
// horario o descripción de otra marca). `brand` nombra una sede sin nombre.
function mapLocation(l: ApiLocation, brand: string): StoreLocation {
  const lat = l.lat ?? l.latitude;
  const lng = l.lng ?? l.longitude;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const address = l.address ?? l.street ?? "";
  const city = l.city ?? "";
  const place = encodeURIComponent([address, city].filter(Boolean).join(", "));
  return {
    slug: l.slug ?? l.id ?? "sede",
    name: l.name ?? brand,
    neighborhood: l.neighborhood ?? city,
    address,
    city,
    hours: l.hours ?? l.schedule ?? l.openingHours ?? "",
    phone: l.phone ?? l.phoneNumber ?? "",
    // Sin coordenadas el mapa embebido no tiene a dónde apuntar; los enlaces
    // de abajo usan la dirección escrita.
    coordinates: { lat: hasCoords ? lat : 0, lng: hasCoords ? lng : 0 },
    features: l.features ?? [],
    description: l.description ?? "",
    googleMapsUrl: hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${place}`,
    wazeUrl: hasCoords
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://waze.com/ul?q=${place}&navigate=yes`,
  };
}

export async function listStoreLocations(): Promise<StoreLocation[]> {
  if (env.useMocks) return STORE_LOCATIONS;
  try {
    const [slug, tenant] = await Promise.all([tenantSlug(), getCurrentTenant()]);
    const res = await fetch(`${env.apiUrlInternal}/v1/locations`, {
      headers: { ...serverOriginHeaders(), "X-Tenant-Slug": slug },
      // La API revalida esta etiqueta al editar sedes (app/api/revalidate).
      next: { revalidate: 3600, tags: [tenantCacheTag(slug, "locations")] },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: ApiLocation[] = Array.isArray(data)
      ? data
      : (data?.items ?? data?.data ?? []);
    return list.map((l) => mapLocation(l, tenant.brand));
  } catch {
    return [];
  }
}

// ── Brew guides ───────────────────────────────────────────────────────────────

interface ApiBrewStep {
  title?: string;
  body?: string;
  description?: string;
  content?: string;
  durationSec?: number;
  duration?: number;
  waterG?: number | null;
}

interface ApiBrewGuide {
  id?: string;
  slug?: string;
  method?: string;
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  totalTime?: string;
  estimatedTime?: string;
  difficulty?: string;
  steps?: ApiBrewStep[];
  recipe?: Partial<BrewRecipe> | null;
  coverUrl?: string | null;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

function mapBrewGuide(g: ApiBrewGuide): BrewGuide {
  const difficulty = (g.difficulty ?? "Media") as BrewGuide["difficulty"];
  return {
    slug: g.slug ?? g.id ?? "guia",
    method: g.method ?? g.title ?? g.name ?? "Método",
    summary: g.summary ?? g.description ?? "",
    totalTime: g.totalTime ?? g.estimatedTime ?? "",
    difficulty: (["Fácil", "Media", "Avanzada"] as const).includes(
      difficulty as "Fácil" | "Media" | "Avanzada",
    )
      ? (difficulty as BrewGuide["difficulty"])
      : "Media",
    steps: (g.steps ?? []).map((s) => ({
      title: s.title ?? "",
      body: s.body ?? s.description ?? s.content ?? "",
      durationSec: s.durationSec ?? s.duration ?? 0,
      waterG: num(s.waterG),
    })),
    recipe: g.recipe
      ? {
          coffeeG: num(g.recipe.coffeeG),
          waterMl: num(g.recipe.waterMl),
          tempC: num(g.recipe.tempC),
          grind: typeof g.recipe.grind === "string" ? g.recipe.grind : "",
        }
      : null,
    coverUrl: g.coverUrl ?? null,
  };
}

async function fetchBrewGuides(): Promise<BrewGuide[]> {
  const slug = await tenantSlug();
  const res = await fetch(`${env.apiUrlInternal}/v1/brew-guides`, {
    headers: { ...serverOriginHeaders(), "X-Tenant-Slug": slug },
    next: { revalidate: 3600, tags: [tenantCacheTag(slug, "brew-guides")] },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list: ApiBrewGuide[] = Array.isArray(data)
    ? data
    : (data?.items ?? data?.data ?? []);
  return list.map(mapBrewGuide);
}

export async function listBrewGuides(): Promise<BrewGuide[]> {
  if (env.useMocks) return BREW_GUIDES;
  try {
    const list = await fetchBrewGuides();
    return list;
  } catch {
    return [];
  }
}

// Sin la guía en la API (no existe o la API falla) la página responde 404:
// nunca se rellena con la guía de ejemplo de otra tienda.
export async function getBrewGuide(slug: string): Promise<BrewGuide | undefined> {
  if (env.useMocks) return findGuideMock(slug);
  try {
    const tenSlug = await tenantSlug();
    const res = await fetch(`${env.apiUrlInternal}/v1/brew-guides/${encodeURIComponent(slug)}`, {
      headers: { ...serverOriginHeaders(), "X-Tenant-Slug": tenSlug },
      next: {
        revalidate: 3600,
        tags: [tenantCacheTag(tenSlug, "brew-guides"), tenantCacheTag(tenSlug, `brew-guide:${slug}`)],
      },
    });
    if (!res.ok) return undefined;
    return mapBrewGuide((await res.json()) as ApiBrewGuide);
  } catch {
    return undefined;
  }
}
