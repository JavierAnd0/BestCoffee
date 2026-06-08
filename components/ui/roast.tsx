import { cn } from "@/lib/utils";

export function Roast({
  level,
  showLabel = true,
  className,
}: {
  level: number;
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(9, Math.round(level)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tueste {clamped}/9
        </span>
      )}
      <div className="flex items-center gap-[3px]" aria-label={`Nivel de tueste ${clamped} de 9`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-[8px] w-[10px] rounded-[1px] border border-foreground/20",
              i < clamped ? "bg-foreground/80" : "bg-transparent",
            )}
          />
        ))}
      </div>
    </div>
  );
}
