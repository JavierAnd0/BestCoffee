import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShipBar({
  pct,
  remaining,
  className,
}: {
  pct: number;
  remaining: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Truck className="size-3.5" />
        <span>Te faltan {remaining} para envío gratis</span>
      </div>
    </div>
  );
}
