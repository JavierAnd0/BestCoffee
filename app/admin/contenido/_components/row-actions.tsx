"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentActionResult } from "@/lib/actions/admin-content";

/** Botón que ejecuta una acción del servidor y muestra el error si falla. */
export function ActionButton({
  label,
  action,
  confirmText,
  variant = "outline",
  className,
}: {
  label: string;
  className?: string;
  action: () => Promise<ContentActionResult>;
  /** Si se indica, pide confirmación antes (borrados). */
  confirmText?: string;
  variant?: "outline" | "destructive" | "ghost";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={variant}
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          start(async () => {
            const r = await action();
            if (!r.ok) setError(r.error);
            else router.refresh();
          });
        }}
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        {label}
      </Button>
      {error && <span role="alert" className="text-[11px] text-red-700">{error}</span>}
    </span>
  );
}
