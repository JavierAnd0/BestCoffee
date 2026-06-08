import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-3 w-32 mb-2" />
      <Skeleton className="h-12 w-48 mb-12" />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        <aside className="space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4 mt-2" />
            </div>
          ))}
        </aside>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="space-y-3">
              <Skeleton className="h-52 w-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
