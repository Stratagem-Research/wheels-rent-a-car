import { formatUsd } from "@/lib/booking/pricing";
import type { AddOn } from "@/types/domain";

/** Once this add-on is active, the extras step asks for the second driver's details. */
export const ADDITIONAL_DRIVER_ADDON_ID = "ao-extra-driver";

export function addOnUnitPriceLabel(addOn: AddOn): string {
  if (addOn.priceCents === 0) return "Free";
  const unit =
    addOn.quantityUnit === "gb" ? "/GB" : addOn.pricing === "per-day" ? "/day" : "";
  return `${formatUsd(addOn.priceCents)}${unit}`;
}

export function extraQtyLabel(addOn: AddOn, qty: number): string {
  if (addOn.quantityUnit === "gb") return `${qty} GB · `;
  return qty > 1 ? `${qty} × ` : "";
}
