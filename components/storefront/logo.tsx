"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBrand } from "./brand-context";

export function Logo({
  size = 20,
  href = "/",
  className,
  brand: brandProp,
  logoUrl: logoProp,
}: {
  /** Imagen del logo de la tienda. Sin ella se muestra el nombre en texto. */
  logoUrl?: string | null;
  size?: number;
  href?: string;
  className?: string;
  brand?: string;
}) {
  // Sin props explícitas, la marca viene del layout (BrandProvider).
  const ctx = useBrand();
  const brand = brandProp ?? ctx.brand;
  const logoUrl = logoProp === undefined ? ctx.logoUrl : logoProp;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-display font-semibold tracking-[-0.02em]",
        className,
      )}
      style={{ fontSize: size }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo de dominio arbitrario por tienda
        <img src={logoUrl} alt={brand} style={{ height: size * 1.5, width: "auto" }} />
      ) : (
        <>
      <svg
        width={size * 0.9}
        height={size * 0.9}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        aria-hidden="true"
      >
        <ellipse cx="10" cy="10" rx="6" ry="8" />
        <path d="M10 2.5c-2.6 3-2.6 12 0 15" />
      </svg>
      <span>{brand}</span>
        </>
      )}
    </Link>
  );
}
