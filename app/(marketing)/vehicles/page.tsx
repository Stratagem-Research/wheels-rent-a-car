import { Suspense } from "react";
import { VehiclesClient } from "./_components/VehiclesClient";

/**
 * /vehicles — Phase 7 canonical results page. Thin server wrapper holding
 * the static `metadata`; the interactive grid + inline expansion live in
 * <VehiclesClient />.
 */

export const metadata = {
  title: "Our Fleet — Premium Cars in Lebanon · Wheels Rent A Car",
  description:
    "Browse the Wheels fleet — sedan, SUV, luxury, and 7-seater categories. Filter by price, transmission, and features. Select inline and book in seconds.",
};

export default function VehiclesPage() {
  return (
    <Suspense fallback={null}>
      <VehiclesClient />
    </Suspense>
  );
}
