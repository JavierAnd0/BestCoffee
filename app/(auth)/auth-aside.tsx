"use client";

import { createContext, useContext } from "react";
import { Logo } from "@/components/storefront/logo";

/** Datos de la tienda para el panel decorativo de las pantallas de acceso. */
export interface AuthStoreInfo {
  brand: string;
  tagline: string | null;
  city: string | null;
}

const AuthStoreContext = createContext<AuthStoreInfo>({ brand: "", tagline: null, city: null });

export function AuthStoreProvider({
  value,
  children,
}: {
  value: AuthStoreInfo;
  children: React.ReactNode;
}) {
  return <AuthStoreContext.Provider value={value}>{children}</AuthStoreContext.Provider>;
}

/**
 * Panel izquierdo de login, registro y recuperación. Solo muestra datos de la
 * tienda (lema, nombre y ciudad); sin dato, no se inventa nada. `children`
 * reemplaza el lema cuando la pantalla tiene su propio mensaje.
 */
export function AuthAside({ children }: { children?: React.ReactNode }) {
  const { brand, tagline, city } = useContext(AuthStoreContext);
  const footer = [brand, city].filter(Boolean).join(" · ");
  const middle =
    children ??
    (tagline ? (
      <p
        className="font-display italic font-light leading-[1.18] tracking-[-0.02em]"
        style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)" }}
      >
        {tagline}
      </p>
    ) : null);

  return (
    <aside
      className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
      style={{ background: "var(--cream-dark)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: "var(--grain)", backgroundRepeat: "repeat", backgroundSize: "200px" }}
      />
      <Logo size={18} href="/" className="relative z-10" />
      <div className="relative z-10 space-y-8">{middle}</div>
      {footer ? (
        <p className="relative z-10 text-xs tracking-[0.16em] uppercase text-muted-foreground font-medium">
          {footer}
        </p>
      ) : (
        <span aria-hidden />
      )}
    </aside>
  );
}
