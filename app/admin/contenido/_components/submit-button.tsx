"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormActions({
  pending,
  cancelHref,
  submitLabel,
  keepScroll,
}: {
  pending: boolean;
  cancelHref: string;
  submitLabel: string;
  /** Dentro de un panel: botones fijos abajo y Cancelar sin saltar al inicio. */
  keepScroll?: boolean;
}) {
  return (
    <div
      className={
        keepScroll
          ? "sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-border bg-background px-6 py-4"
          : "flex justify-end gap-2"
      }
    >
      <Button variant="outline" render={<Link href={cancelHref} scroll={!keepScroll}>Cancelar</Link>} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
