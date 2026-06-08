import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="space-y-12">
      <Skeleton className="h-12 w-64" />
      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-36" />
      <Skeleton className="h-40" />
    </div>
  );
}
