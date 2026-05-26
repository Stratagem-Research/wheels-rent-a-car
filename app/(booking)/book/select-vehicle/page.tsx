"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /book/select-vehicle — Phase 7 shim.
 *
 * Step 1 of the booking funnel now lives at `/vehicles?step=1` so the
 * customer sees one unified results page (Sixt pattern, inline expansion).
 * This route just forwards any incoming query string and redirects.
 *
 * The booking layout's Stepper renders inside `/vehicles` when `step=1` is
 * present, keeping the funnel UX intact while consolidating routes.
 */
export default function SelectVehicleShim() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("step", "1");
    router.replace(`/vehicles?${next.toString()}`);
  }, [router, searchParams]);

  return null;
}
