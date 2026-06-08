import { cn } from "@/lib/utils";

export function Stars({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <div className={cn("flex items-center gap-[2px]", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < clamped;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            className={filled ? "text-foreground" : "text-foreground/20"}
            aria-hidden="true"
          >
            <path
              d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.9 4.9 17.3 6 11.6 1.7 7.6l5.8-.7z"
              fill="currentColor"
            />
          </svg>
        );
      })}
      {count != null && (
        <span className="ml-2 text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
