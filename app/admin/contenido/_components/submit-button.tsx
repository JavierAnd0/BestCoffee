"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormActions({
  pending,
  cancelHref,
  submitLabel,
}: {
  pending: boolean;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" render={<Link href={cancelHref}>Cancelar</Link>} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
