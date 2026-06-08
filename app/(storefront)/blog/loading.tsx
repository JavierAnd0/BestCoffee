import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <>
      <Skeleton className="h-[420px] w-full rounded-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <Skeleton className="h-3 w-32 mb-6" />
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Skeleton className="h-6 w-48 mb-10" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
