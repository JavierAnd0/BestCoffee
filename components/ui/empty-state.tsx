import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 size-12 rounded-full bg-muted grid place-items-center text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
