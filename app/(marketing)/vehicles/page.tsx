import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VehiclesClient } from "./_components/VehiclesClient";

/**
 * /vehicles — Phase 7 canonical results page. Thin server wrapper holding
 * the static `metadata`; the interactive grid + inline expansion live in
 * <VehiclesClient />.
 */

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("vehiclesTitle"), description: t("vehiclesDescription") };
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={null}>
      <VehiclesClient />
    </Suspense>
  );
}
