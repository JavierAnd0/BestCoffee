// Colecciones públicas de la tienda (API: /v1/collections, requiere `catalog`).

import { cache } from "react";
import { headers } from "next/headers";
import { env } from "../env";
import { tenantCacheTag } from "./cache-tags";
import { apiServer } from "../api/client";
import { mapProduct, type ApiProduct } from "../api/mappers";
import type { Product } from "../types";
import { serverOriginHeaders } from "@/lib/api/client-ip";

export interface StoreCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: "MANUAL" | "AUTO";
}

export interface StoreCollectionDetail extends StoreCollection {
  products: Product[];
}

interface ApiStoreCollection {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  type: "MANUAL" | "AUTO";
  products?: Partial<ApiProduct>[];
}

function mapCollection(c: ApiStoreCollection): StoreCollection {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? null,
    type: c.type,
  };
}

/** Colecciones de la tienda, en el orden definido en el panel. Lista vacía si falla. */
export const listStoreCollections = cache(async (): Promise<StoreCollection[]> => {
  if (env.useMocks) return [];
  try {
    const api = await apiServer();
    const { data, error } = await api.GET("/v1/collections");
    if (error || !Array.isArray(data)) return [];
    return (data as unknown as ApiStoreCollection[]).map(mapCollection);
  } catch {
    return [];
  }
});

/**
 * ¿La tienda tiene colecciones publicadas? Lo calcula el layout de la tienda para
 * mostrar el enlace a /colecciones en cabecera y pie solo cuando lleva a algo.
 * En caché por tienda: la API revalida la etiqueta `collections` al editarlas
 * (app/api/revalidate); si ese aviso no llega, caduca a los 5 minutos.
 */
export const storeHasCollections = cache(async (): Promise<boolean> => {
  if (env.useMocks) return false;
  try {
    const slug = (await headers()).get("x-tenant-slug") ?? env.defaultTenantSlug;
    const res = await fetch(`${env.apiUrlInternal}/v1/collections`, {
      headers: { ...serverOriginHeaders(), "X-Tenant-Slug": slug },
      next: { revalidate: 300, tags: [tenantCacheTag(slug, "collections")] },
    });
    if (!res.ok) return false;
    const data: unknown = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
});

/** Colección con sus productos resueltos, o null si no existe en esta tienda. */
export const getStoreCollection = cache(
  async (slug: string): Promise<StoreCollectionDetail | null> => {
    if (env.useMocks) return null;
    try {
      const api = await apiServer();
      const { data, error } = await api.GET("/v1/collections/{slug}", {
        params: { path: { slug } },
      });
      if (error || !data) return null;
      const c = data as unknown as ApiStoreCollection;
      return {
        ...mapCollection(c),
        // La API devuelve la selección de tarjeta (sin estado ni descripción):
        // los productos ya vienen filtrados a ACTIVE por el backend.
        products: (c.products ?? []).map((p) =>
          mapProduct({
            status: "ACTIVE",
            subscriptionAvailability: "YES",
            ...p,
          } as ApiProduct),
        ),
      };
    } catch {
      return null;
    }
  },
);
