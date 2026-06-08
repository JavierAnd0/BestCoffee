"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Choice({
  children,
  picked,
  big = false,
  onClick,
  className,
}: {
  children: React.ReactNode;
  picked?: boolean;
  big?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={cn(
        "group flex items-center gap-3 w-full rounded-lg border bg-background text-left transition-colors",
        big ? "p-4" : "px-3 py-2.5",
        picked
          ? "border-foreground/40 bg-muted/60"
          : "border-border hover:border-foreground/20 hover:bg-muted/30",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full border transition-colors",
          big ? "size-5" : "size-4",
          picked
            ? "border-foreground bg-foreground text-background"
            : "border-foreground/30 bg-transparent",
        )}
      >
        {picked && <Check className={big ? "size-3" : "size-2.5"} strokeWidth={3} />}
      </span>
      <span className={cn(big ? "text-base" : "text-sm", "font-medium")}>{children}</span>
    </button>
  );
}
