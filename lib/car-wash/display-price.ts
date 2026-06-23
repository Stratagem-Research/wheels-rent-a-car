import { formatLbp, formatUsd } from "@/lib/booking/pricing";
import type { CarWashPackage } from "@/types/domain";

export function resolveCarWashPrice(
  pkg: CarWashPackage,
  vehicleClass?: "car" | "suv",
): { amount: number; currency: "USD" | "LBP"; label: string } | null {
  if (pkg.quoteOnly) return null;
  if (pkg.pricingMode === "by_vehicle_class") {
    const match =
      pkg.vehiclePrices?.find((v) => v.vehicleClass === vehicleClass) ??
      pkg.vehiclePrices?.[0];
    if (!match) return null;
    return {
      amount: match.amount,
      currency: "LBP",
      label: formatLbp(match.amount),
    };
  }
  if (pkg.currency === "USD" && pkg.priceCents != null) {
    return {
      amount: pkg.priceCents,
      currency: "USD",
      label: formatUsd(pkg.priceCents),
    };
  }
  if (pkg.currency === "LBP" && pkg.priceLbp != null) {
    return {
      amount: pkg.priceLbp,
      currency: "LBP",
      label: formatLbp(pkg.priceLbp),
    };
  }
  return null;
}

export function formatCarWashPackagePrice(
  pkg: CarWashPackage,
  labels: { car: string; suv: string; quoteOnRequest: string },
  vehicleClass?: "car" | "suv",
): string {
  if (pkg.quoteOnly) return labels.quoteOnRequest;
  if (pkg.pricingMode === "by_vehicle_class" && pkg.vehiclePrices?.length) {
    return pkg.vehiclePrices
      .map((v) => {
        const classLabel = v.vehicleClass === "car" ? labels.car : labels.suv;
        return `${classLabel}: ${formatLbp(v.amount)}`;
      })
      .join(" · ");
  }
  const resolved = resolveCarWashPrice(pkg, vehicleClass);
  return resolved?.label ?? labels.quoteOnRequest;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${hours} hr` : `${hours.toFixed(1)} hr`;
}
