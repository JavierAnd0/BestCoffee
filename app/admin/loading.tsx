import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
