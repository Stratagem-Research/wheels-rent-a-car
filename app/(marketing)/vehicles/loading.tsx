import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-level loading UI for /vehicles — Next.js wraps `page.tsx` in a
 * Suspense boundary using this as the fallback automatically, so it shows
 * immediately on navigation while the server awaits the vehicle catalog +
 * branches + (optionally) live availability. Mirrors the real layout
 * (sticky search band, toolbar, 3-column card grid) so there's no visible
 * reflow once the real content swaps in.
 */

const SKELETON_ROWS = 3;
const ROW_SIZE = 3;

export default function VehiclesLoading() {
  return (
    <>
      <section className="bg-paper border-border sticky top-0 z-20 border-b">
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-3 sm:px-5">
          <Skeleton className="h-12 w-full rounded-pill sm:h-14" />
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-12">
        <Skeleton className="h-9 w-72 max-w-full" />

        <div className="mt-6 flex flex-wrap items-center gap-2 lg:mt-8">
          <Skeleton className="h-9 w-28 rounded-pill" />
          <Skeleton className="h-9 w-24 rounded-pill" />
          <Skeleton className="h-9 w-24 rounded-pill" />
          <Skeleton className="h-9 w-24 rounded-pill" />
          <Skeleton className="ml-auto h-5 w-16" />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:gap-6 lg:mt-8">
          {Array.from({ length: SKELETON_ROWS }).map((_, row) => (
            <div key={row} className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: ROW_SIZE }).map((_, col) => (
                <VehicleCardSkeleton key={col} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function VehicleCardSkeleton() {
  return (
    <div className="bg-ink-95 flex h-full flex-col gap-4 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="bg-paper/10 h-5 w-40" />
        <Skeleton className="bg-paper/10 h-3 w-24" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="bg-paper/10 h-6 w-10 rounded-pill" />
        <Skeleton className="bg-paper/10 h-6 w-10 rounded-pill" />
        <Skeleton className="bg-paper/10 h-6 w-20 rounded-pill" />
      </div>
      <Skeleton className="bg-paper/10 aspect-[16/10] w-full rounded-lg" />
      <Skeleton className="bg-paper/10 h-4 w-32" />
      <div className="flex items-end justify-between gap-3">
        <Skeleton className="bg-paper/10 h-8 w-24" />
        <Skeleton className="bg-paper/10 h-3 w-16" />
      </div>
    </div>
  );
}
