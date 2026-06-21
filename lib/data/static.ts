import { env } from "../env";
import {
  STORE_LOCATIONS,
  BREW_GUIDES,
  findGuide as findGuideMock,
  type StoreLocation,
  type BrewGuide,
} from "../mocks/static";
import { headers } from "next/headers";

async function tenantSlug(): Promise<string> {
  const h = await headers();
  return h.get("x-tenant-slug") ?? env.defaultTenantSlug;
}

// ── Store locations ───────────────────────────────────────────────────────────

interface ApiLocation {
  id?: string;
  slug?: string;
  name?: string;
  address?: string;
  street?: string;
  city?: string;
  hours?: string;
  schedule?: string;
  openingHours?: string;
  phone?: string;
  phoneNumber?: string;
}

function mapLocation(l: ApiLocation): StoreLocation {
  return {
    slug: l.slug ?? l.id ?? "store",
    name: l.name ?? "ORÍGEN",
    address: l.address ?? l.street ?? "",
    city: l.city ?? "Bogotá",
    hours: l.hours ?? l.schedule ?? l.openingHours ?? "",
    phone: l.phone ?? l.phoneNumber ?? "",
  };
}

export async function listStoreLocations(): Promise<StoreLocation[]> {
  if (env.useMocks) return STORE_LOCATIONS;
  try {
    const slug = await tenantSlug();
    const res = await fetch(`${env.apiUrlInternal}/v1/locations`, {
      headers: { "X-Tenant-Slug": slug },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return STORE_LOCATIONS;
    const data = await res.json();
    const list: ApiLocation[] = Array.isArray(data)
      ? data
      : (data?.items ?? data?.data ?? []);
    // Fall back to mock content if the tenant hasn't added stores yet
    if (list.length === 0) return STORE_LOCATIONS;
    return list.map(mapLocation);
  } catch {
    return STORE_LOCATIONS;
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
}

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
    })),
  };
}

async function fetchBrewGuides(): Promise<BrewGuide[]> {
  const slug = await tenantSlug();
  const res = await fetch(`${env.apiUrlInternal}/v1/brew-guides`, {
    headers: { "X-Tenant-Slug": slug },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return BREW_GUIDES;
  const data = await res.json();
  const list: ApiBrewGuide[] = Array.isArray(data)
    ? data
    : (data?.items ?? data?.data ?? []);
  if (list.length === 0) return BREW_GUIDES;
  return list.map(mapBrewGuide);
}

export async function listBrewGuides(): Promise<BrewGuide[]> {
  if (env.useMocks) return BREW_GUIDES;
  try {
    return await fetchBrewGuides();
  } catch {
    return BREW_GUIDES;
  }
}

export async function getBrewGuide(slug: string): Promise<BrewGuide | undefined> {
  if (env.useMocks) return findGuideMock(slug);
  try {
    const tenSlug = await tenantSlug();
    const res = await fetch(`${env.apiUrlInternal}/v1/brew-guides/${encodeURIComponent(slug)}`, {
      headers: { "X-Tenant-Slug": tenSlug },
      next: { revalidate: 3600 },
    });
    if (res.ok) return mapBrewGuide((await res.json()) as ApiBrewGuide);
    // Fall back to fetching the full list and finding the guide
    const all = await fetchBrewGuides();
    return all.find((g) => g.slug === slug);
  } catch {
    return findGuideMock(slug);
  }
}
