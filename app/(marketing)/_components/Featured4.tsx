import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { Button } from "@/components/ui/Button";
import type { Vehicle } from "@/types/domain";

/**
 * Featured Cars — landingpage.md §4. Full-bleed ink-100 band; dark
 * VehicleCards lifted onto the dark gradient so they read off the band.
 *
 * Desktop layout is a 2×2 grid (was 1×4) so each card has room to
 * breathe and the photo sits at a more legible size. Mobile keeps the
 * horizontal snap-scroll affordance.
 */
export async function Featured4({ vehicles }: { vehicles: Vehicle[] }) {
  const t = await getTranslations("landing.featured");
  const four = vehicles.slice(0, 4);

  return (
    <Reveal as="section" className="bg-ink-100 text-paper">
      <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-32">
        <div className="mb-10 flex max-w-3xl flex-col gap-3 lg:mb-14">
          <p className="text-ink-40 overline">{t("eyebrow")}</p>
          <h2 className="display-lg text-paper text-[clamp(40px,6vw,72px)] leading-[0.98]">
            {t("heading")}
          </h2>
        </div>

        {/* Mobile: horizontal snap-scroll. md+: 2×2 grid. Larger gap on
         * desktop so the dark cards have breathing room between them. */}
        <ul
          className={[
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
            "md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0",
            "lg:gap-8",
          ].join(" ")}
        >
          {four.map((v) => (
            <li key={v.id} className="w-[78%] min-w-0 shrink-0 snap-start sm:w-[55%] md:w-auto">
              <VehicleCard vehicle={v} href={`/book/select-vehicle?vehicleId=${v.id}`} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center lg:mt-14">
          <Button asChild variant="secondary-inverse" size="lg">
            <Link href="/vehicles">
              {t("viewFullFleet")} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
