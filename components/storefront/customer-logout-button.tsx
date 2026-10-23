"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useCart } from "@/components/storefront/cart-context";
import { logoutAction } from "@/lib/actions/auth";

interface CustomerLogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function CustomerLogoutButton({
  className,
  children,
  showIcon = true,
}: CustomerLogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const cart = useCart();

  async function handleLogout() {
    if (isPending) return;

    try {
      setIsPending(true);

      // 1. Limpiar estado en memoria de React (Carrito de compras y contextos)
      cart.clear();

      // 2. Limpiar sesión en el cliente de Neon Auth / Better Auth
      try {
        await authClient.signOut();
      } catch (err) {
        console.warn("Neon authClient signOut notice:", err);
      }

      // 3. Limpiar almacenamiento local y de sesión en el navegador (localStorage y sessionStorage)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn("Browser storage clear notice:", err);
      }

      // 4. Notificar al backend NestJS (/v1/auth/customer/logout) y eliminar cookies en el servidor
      try {
        await logoutAction(false);
      } catch (err) {
        // En Next.js, si ocurre un redirect interno, lo atrapamos
        console.warn("Server action logout response:", err);
      }

      // 5. Redirección forzada (Hard reload) hacia /login
      // Esto destruye el heap de memoria de JavaScript, vaciando por completo
      // la caché del router de Next.js (RSC cache) para evitar que un nuevo usuario
      // acceda a datos de la sesión anterior en memoria.
      window.location.href = "/login";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      // Garantizar que siempre se redirija a /login ante cualquier eventualidad
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={
        className ||
        "mt-2 w-full inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left disabled:opacity-60 cursor-pointer"
      }
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : showIcon ? (
        <LogOut className="size-4 shrink-0" />
      ) : null}
      <span>
        {isPending
          ? "Cerrando sesión..."
          : children || "Cerrar sesión"}
      </span>
    </button>
  );
}

