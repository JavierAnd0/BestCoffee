"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Panel lateral que se abre encima de la lista para crear o editar sin salir
 * de la página. Se cierra con la X, con Escape o tocando fuera; al guardar, la
 * acción del servidor vuelve a la lista y el panel desaparece solo.
 */
export function EditPanel({
  title,
  description,
  closeHref,
  children,
}: {
  title: string;
  description?: string;
  /** La lista sin el parámetro que abre el panel. */
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => router.push(closeHref, { scroll: false });
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Foco en el primer campo para escribir de una.
    panelRef.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/25 animate-in fade-in duration-200"
        onClick={close}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-panel-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300 ease-out"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <h2 id="edit-panel-title" className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Tooltip content="Cerrar">
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </Tooltip>
        </header>
        <div className="flex-1 overflow-y-auto px-6 pt-6">{children}</div>
      </div>
    </div>
  );
}
