import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryWordmarkCard } from "@/components/landing/CategoryWordmarkCard";

/**
 * Categories section — landingpage.md §2. Rivian-pattern wordmark cards
 * in a horizontal snap-scroll row.
 *
 * Layout:
 *   - Title block sits inside the standard 1280px max-width container
 *     with 40px gutter, so it lines up with every other section heading.
 *   - The scroll row is full-bleed across the viewport. Its first card
 *     is anchored to the same x-coordinate as the title (via a calc()
 *     padding-left that grows on viewports wider than the container).
 *     The last card has a matching padding-right so it doesn't crash
 *     into the viewport edge when fully scrolled.
 *
 * The previous attempt clipped the scroll INSIDE the max-width container
 * which left an ugly cropped sliver of the third card at the container's
 * right edge on lg viewports. Full-bleed scroll moves the cropping out
 * to the viewport edge where horizontal scrolls are supposed to fade.
 */

const CATEGORIES = [
  {
    slug: "sedan",
    nameKey: "sedanName",
    descriptionKey: "sedanDescription",
    priceFromUSD: 32,
    image: {
      src: "/images/Car Images/kia-cerato-2018-.png",
      alt: "Kia Cerato sedan in profile",
      width: 1080,
      height: 720,
    },
  },
  {
    slug: "suv",
    nameKey: "suvName",
    descriptionKey: "suvDescription",
    priceFromUSD: 48,
    image: {
      src: "/images/Car Images/kia-sportage-2018-.png",
      alt: "Kia Sportage SUV in profile",
      width: 1080,
      height: 720,
    },
  },
  {
    slug: "luxury",
    nameKey: "luxuryName",
    descriptionKey: "luxuryDescription",
    priceFromUSD: 95,
    image: {
      src: "/images/Car Images/Untitled-design-2025-06-13T023458.246-1.png",
      alt: "Luxury vehicle in profile",
      width: 1080,
      height: 720,
    },
  },
  {
    slug: "7-seater",
    nameKey: "sevenSeaterName",
    descriptionKey: "sevenSeaterDescription",
    priceFromUSD: 65,
    image: {
      src: "/images/Car Images/MISTUBISHI-OUTLANDER.png",
      alt: "Mitsubishi Outlander 7-seater in profile",
      width: 1080,
      height: 720,
    },
  },
] as const;

/**
 * Aligns the scroll's first / last card with the centered max-width
 * container on wide viewports. Equivalent to:
 *   - On viewports ≤ 1280px (container width): 40px gutter
 *   - On wider viewports: half of (viewport − 1280px) + 40px, so the
 *     padding grows symmetrically as the viewport widens.
 */
const ALIGNED_GUTTER = "max(2.5rem, calc((100vw - 80rem) / 2 + 2.5rem))";

export async function Categories() {
  const t = await getTranslations("landing.categories");
  return (
    <Reveal as="section" className="bg-paper">
      {/* Title — aligned with the standard section container. */}
      <div className="mx-auto max-w-[var(--container-default)] px-5 pt-16 sm:px-10 lg:pt-32">
        <div className="mb-10 flex max-w-2xl flex-col gap-3 lg:mb-14">
          <p className="text-ink-60 overline">{t("eyebrow")}</p>
          <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            {t("heading")}
          </h2>
        </div>
      </div>

      {/* Full-bleed scroll. First card's left padding lands it under the
       * title's left edge via ALIGNED_GUTTER; last card's right padding
       * mirrors that so the scroll-end has breathing room from the
       * viewport edge. Section bottom padding lives here too. */}
      <div className="[scrollbar-width:none] overflow-x-auto pb-16 lg:pb-32 [&::-webkit-scrollbar]:hidden">
        <ul
          className="flex w-max snap-x snap-mandatory gap-5 sm:gap-6"
          style={{ paddingLeft: ALIGNED_GUTTER, paddingRight: ALIGNED_GUTTER }}
        >
          {CATEGORIES.map((c) => (
            <li
              key={c.slug}
              className="w-[85vw] shrink-0 snap-start sm:w-[540px] lg:w-[600px] xl:w-[640px]"
            >
              <CategoryWordmarkCard
                slug={c.slug}
                priceFromUSD={c.priceFromUSD}
                image={c.image}
                categoryName={t(c.nameKey)}
                description={t(c.descriptionKey)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
