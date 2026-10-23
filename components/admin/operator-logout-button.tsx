"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { logoutOperatorAction } from "@/lib/actions/operator-auth";

interface OperatorLogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function OperatorLogoutButton({
  className,
  children,
  showIcon = true,
}: OperatorLogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) return;
    try {
      setIsPending(true);
      // Limpiar almacenamiento de sesión en el navegador
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn("Storage clear notice:", err);
      }
      // Ejecutar la server action para limpiar cookies HTTP-Only de sesión de operador
      await logoutOperatorAction();
    } catch {
      // Si Next.js redirige vía redirect(), se lanzará NEXT_REDIRECT internamente.
      // Si falla cualquier cosa, redirigimos limpiamente.
      window.location.href = "/acceso";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      aria-label="Cerrar sesión"
      className={className || "text-muted-foreground hover:text-foreground transition-colors cursor-pointer"}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : showIcon ? (
        <LogOut className="size-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

