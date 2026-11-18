"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number;
  onChange?: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const dec = () => onChange?.(Math.max(min, value - 1));
  const inc = () => onChange?.(Math.min(max, value + 1));
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background h-9",
        className,
      )}
    >
      <Tooltip content="Disminuir">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="grid place-items-center h-full w-9 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          aria-label="Disminuir"
        >
          <Minus className="size-3.5" />
        </button>
      </Tooltip>
      <span className="min-w-7 text-center text-sm font-medium tabular-nums">{value}</span>
      <Tooltip content="Aumentar">
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="grid place-items-center h-full w-9 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          aria-label="Aumentar"
        >
          <Plus className="size-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}
