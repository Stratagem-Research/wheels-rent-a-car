import { redirect } from "next/navigation";

/**
 * /book — entry redirect per 04_booking_flow.md.
 *   If search criteria are present (`pickupAt` + a pickup location),
 *   forward to step 1. Otherwise send users to fleet browse to pick a car.
 */
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookEntry({ searchParams }: PageProps) {
  const sp = await searchParams;
  const hasCriteria =
    typeof sp.pickupAt === "string" &&
    (typeof sp.pickupLoc === "string" || typeof sp.pickupAddr === "string");

  if (hasCriteria) {
    const qs = new URLSearchParams(
      Object.entries(sp).reduce<Record<string, string>>((acc, [k, v]) => {
        if (typeof v === "string") acc[k] = v;
        return acc;
      }, {}),
    ).toString();
    redirect(`/book/select-vehicle?${qs}`);
  }
  redirect("/vehicles");
}
