import { VehicleCard } from "./VehicleCard";
import type { Vehicle } from "@/types/domain";

export function SimilarVehiclesCarousel({
  vehicles,
  heading = "You might also like",
}: {
  vehicles: Vehicle[];
  heading?: string;
}) {
  if (vehicles.length === 0) return null;

  return (
    <section>
      <h2 className="headline-md text-ink-95">{heading}</h2>
      <ul className="mt-5 grid snap-x snap-mandatory auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 sm:gap-6 lg:auto-cols-[minmax(0,1fr)] lg:grid-flow-row lg:grid-cols-3">
        {vehicles.slice(0, 6).map((v) => (
          <li key={v.id} className="snap-start">
            <VehicleCard vehicle={v} variant="light" />
          </li>
        ))}
      </ul>
    </section>
  );
}
