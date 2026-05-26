import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

/**
 * Service promos — Sixt "More Sixt" pattern. Two large dark-gradient cards
 * side by side, each promoting a non-daily-rental service: long-term
 * leasing on the left, chauffeur on the right.
 *
 * Card anatomy (matches the Sixt reference):
 *   - Dark gradient surface (same `--gradient-card-dark` as VehicleCard).
 *   - Title + lead + outline-white pill CTA at the top.
 *   - PNG image slot occupies the bottom half — bleeds to the card edge
 *     so the photo dominates the lower portion of the card.
 *
 * Image slots live at:
 *   /public/images/services/long-term.png
 *   /public/images/services/chauffeur.png
 *
 * (Folder is lowercase + no space so the Next.js Image optimizer URL-
 * encodes cleanly — early version with "Service Images" produced URLs
 * with literal spaces that the dev server 404'd on.)
 *
 * Replaces the previous single-card LongTermPromo block. The
 * /docs/Implementation/landingpage.md §6 section now hosts BOTH service
 * promos (long-term + chauffeur).
 */

const SERVICES = [
  {
    href: "/long-term",
    eyebrow: "One month +",
    title: "Drive longer. Save more.",
    description:
      "Monthly and multi-month plans from $15 a day. Insurance, maintenance, and door delivery included.",
    cta: "Get a quote",
    image: {
      // Drop your final PNG at /public/images/services/long-term.png to swap.
      // The width/height here = the source PNG's intrinsic pixel dimensions
      // so next/image renders at the correct aspect ratio with no crop.
      src: "/images/services/long-term.png",
      alt: "Long-term rental",
      width: 550,
      height: 549,
    },
  },
  {
    href: "/chauffeur",
    eyebrow: "Driven for you",
    title: "Sit back. We drive.",
    description:
      "Airport transfers, day trips, and hourly hire — with vetted, English-speaking drivers and premium vehicles.",
    cta: "Request a driver",
    image: {
      src: "/images/services/chauffeur.png",
      alt: "Chauffeur service",
      width: 584,
      height: 549,
    },
  },
] as const;

export function ServicePromos() {
  return (
    <Reveal as="section" className="bg-ink-10">
      <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-32">
        <div className="mb-10 flex max-w-2xl flex-col gap-3 lg:mb-14">
          <p className="text-ink-60 overline">More from Wheels</p>
          <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            More than just daily rentals.
          </h2>
        </div>

        {/* Cards stretch to match the tallest sibling so both promos are the
         * same height. With justify-between inside each card, any extra
         * height fills the gap BETWEEN the content block and the image
         * (rather than below the image), so the photo stays glued to the
         * bottom edge regardless of which card is taller. */}
        <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {SERVICES.map((s) => (
            <li key={s.href} className="h-full">
              <ServiceCard {...s} />
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

function ServiceCard({
  href,
  eyebrow,
  title,
  description,
  cta,
  image,
}: (typeof SERVICES)[number]) {
  return (
    <article
      className="text-paper relative flex h-full flex-col justify-between overflow-hidden rounded-xl"
      style={{ backgroundImage: "var(--gradient-card-dark)" }}
    >
      {/* TOP — eyebrow, title, lead, CTA. */}
      <div className="flex flex-col gap-4 px-8 pt-8 pb-4 sm:px-10 sm:pt-10 sm:pb-6">
        <p className="text-paper/40 overline">{eyebrow}</p>
        <h3 className="display-md text-paper text-[clamp(28px,3.6vw,44px)] leading-[1]">{title}</h3>
        <p className="body-md text-paper/70 max-w-md">{description}</p>
        <div className="mt-2">
          <Button asChild variant="secondary-inverse" size="md">
            <Link href={href}>
              {cta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* BOTTOM — PNG image, full card width, natural aspect, NO crop.
       *
       * Renders edge to edge horizontally via `w-full h-auto`. Height
       * follows the source PNG's intrinsic aspect ratio so every pixel
       * of the supplied image is visible. Cards are tall as a result
       * (~card-width × image-aspect for the image alone) — that's the
       * cost of "full width + no crop" when the source is near-square.
       *
       * The two PNGs have slightly different aspects (long-term 1.002,
       * chauffeur 1.064) so rendered heights differ by ~40px. The
       * grid's items-stretch + card's justify-between absorbs the
       * difference into the gap between content and image on the
       * shorter card, so total card heights still match. */}
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="-mt-[200px] block h-auto w-full"
      />
    </article>
  );
}
