import { Suspense } from "react";
import { getPublicBranches } from "@/lib/server/public-content";
import { VehiclesLoadingFallback } from "./_components/VehiclesLoadingFallback";

/**
 * Route-level loading UI for /vehicles. Shows the default search window
 * (same dates the page applies) so the date filter is visible while the
 * fleet + availability request finishes.
 */
export default async function VehiclesLoading() {
  const branches = await getPublicBranches();
  return (
    <Suspense>
      <VehiclesLoadingFallback branches={branches} />
    </Suspense>
  );
}
