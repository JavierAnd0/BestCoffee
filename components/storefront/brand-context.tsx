"use client";

import { createContext, useContext } from "react";

export interface BrandInfo {
  brand: string;
  logoUrl: string | null;
}

const BrandContext = createContext<BrandInfo>({ brand: "", logoUrl: null });

/**
 * Marca de la tienda actual para componentes de cliente (login, registro,
 * panel): la fija el layout del servidor, que sí conoce al tenant. Así ningún
 * componente necesita un nombre de marca escrito a mano.
 */
export function BrandProvider({
  brand,
  logoUrl = null,
  children,
}: BrandInfo & { children: React.ReactNode }) {
  return <BrandContext.Provider value={{ brand, logoUrl }}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandInfo {
  return useContext(BrandContext);
}
