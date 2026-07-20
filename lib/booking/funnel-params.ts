import type { BookingDraft, MileagePlan, RateType } from "@/types/domain";
import { seedDraftFromSearchParams } from "@/hooks/useBookingDraft";
import {
  appendSearchContextFromParams,
  draftToSearchParams,
} from "@/lib/booking/draft-to-search-params";

type SetDraftFn = (next: BookingDraft | ((prev: BookingDraft) => BookingDraft)) => void;

export function parseRateFromFunnelParams(params: URLSearchParams): {
  type: RateType;
  mileage: MileagePlan;
} {
  const type: RateType = params.get("rate") === "flexible" ? "flexible" : "best-price";
  const mileage: MileagePlan =
    params.get("mileage") === "capped-200km" ? "capped-200km" : "unlimited";
  return { type, mileage };
}

/** Append vehicle + search context for step-to-step navigation. */
export function appendFunnelParams(
  target: URLSearchParams,
  draft: BookingDraft,
  source?: URLSearchParams,
): void {
  if (source) {
    appendSearchContextFromParams(target, source);
  } else {
    const fromDraft = draftToSearchParams(draft);
    for (const [key, value] of fromDraft.entries()) {
      if (key !== "step") target.set(key, value);
    }
  }
  if (draft.vehicle) {
    target.set("vehicleId", draft.vehicle.vehicleId);
    if (draft.vehicle.vehicleSlug) target.set("vehicleSlug", draft.vehicle.vehicleSlug);
    target.set("rate", draft.vehicle.rate.type);
    target.set("mileage", draft.vehicle.rate.mileage);
  }
}

export function bookingStepHref(
  path: string,
  draft: BookingDraft,
  source?: URLSearchParams,
): string {
  const params = new URLSearchParams();
  appendFunnelParams(params, draft, source);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Merge URL funnel params into sessionStorage draft (atomic). */
export function syncDraftFromFunnelParams(
  params: URLSearchParams,
  setDraft: SetDraftFn,
): void {
  const id = params.get("vehicleId")?.trim();
  const pickupAt = params.get("pickupAt");
  const returnAt = params.get("returnAt");
  if (!id && !(pickupAt && returnAt)) return;

  setDraft((prev) => {
    let next = prev;
    if (pickupAt && returnAt) {
      const seeded = seedDraftFromSearchParams(params);
      next = {
        ...next,
        pickup: { ...next.pickup, ...seeded.pickup },
        return: { ...next.return, ...seeded.return },
        promoCode: seeded.promoCode ?? next.promoCode,
      };
    }
    if (id) {
      const rate = parseRateFromFunnelParams(params);
      const slug = params.get("vehicleSlug")?.trim();
      const current = next.vehicle;
      const vehicleSlug = slug || current?.vehicleSlug;
      if (
        current?.vehicleId !== id ||
        current.rate.type !== rate.type ||
        current.rate.mileage !== rate.mileage ||
        (vehicleSlug && current?.vehicleSlug !== vehicleSlug)
      ) {
        next = {
          ...next,
          vehicle: {
            vehicleId: id,
            rate,
            ...(vehicleSlug ? { vehicleSlug } : {}),
          },
        };
      }
    }
    return next;
  });
}
