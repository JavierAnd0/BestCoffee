import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Skeleton className="h-3 w-48 mb-6" />
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
