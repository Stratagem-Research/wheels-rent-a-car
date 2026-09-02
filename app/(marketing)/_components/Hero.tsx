import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/search/SearchBar";
import type { Branch } from "@/types/domain";

/**
 * Landing hero — Revision 2 cinematic redesign.
 *
 * The hero is now a full-bleed cinematic Lebanon photograph with a dark
 * linear-gradient overlay. The headline + lead + trust chips repaint to
 * paper so they read against the photo; the floating SearchBar stays
 * `card-floating` (paper card) so it still lifts off the background.
 *
 * Swap the source photo at:
 *   /public/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg
 * Replace with the client's final cinematic Lebanon shot (>= 2560x1440 ideal).
 *
 * The global Header is set to `overlay` on `/` (via `app/(marketing)/layout.tsx`
 * or a `usePathname()` override) so the navbar sits transparent on top of
 * the photo until the user scrolls past the hero.
 *
 * Reduced-motion is respected by the SearchBar and downstream Reveal wrappers;
 * the hero itself uses no animation (background fades through CSS only).
 */
export async function Hero({ branches }: { branches: Branch[] }) {
  const t = await getTranslations("home");
  return (
    <section id="home-hero" className="relative isolate -mt-16 overflow-hidden lg:-mt-18">
      {/* Full-bleed cinematic Lebanon photograph. `priority` so it counts as
       * the LCP candidate; `object-position` centres on the horizon. */}
      <Image
        src="/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg"
        alt=""
        role="presentation"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />

      {/* Dark gradient overlay — heavier at the top so the (overlay) header
       * sits on a comfortably dark surface, lighter through the headline
       * read-zone, then heavier again at the bottom so the search card and
       * trust chips also clear contrast. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_35%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.65)_100%)]"
      />

      <div className="mx-auto flex max-w-[var(--container-default)] flex-col items-center gap-10 px-5 pt-24 pb-16 sm:px-10 sm:pt-28 lg:gap-14 lg:pt-36 lg:pb-24">
        {/* Centred headline block, paper text over the photo overlay. */}
        <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
          <h1 className="display-2xl text-paper text-[clamp(40px,7vw,88px)] leading-[0.96] tracking-[-0.035em]">
            {t("heroHeadlineLine1")}
            <br />
            {t("heroHeadlineLine2")}
          </h1>
          <p className="lead-lg text-paper/85 max-w-[540px]">{t("heroSubline")}</p>
        </div>

        {/* Search bar — paper card-floating, lifts cleanly off the photo. */}
        <div className="flex w-full flex-col items-center gap-4">
          <div className="w-full lg:px-8">
            <SearchBar branches={branches} variant="expanded" />
          </div>
          <ul className="label-md text-paper/85 mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <li>{t("trustGoogle")}</li>
            <li aria-hidden="true">·</li>
            <li>{t("trustRentals")}</li>
            <li aria-hidden="true">·</li>
            <li>{t("trustHub")}</li>
            <li aria-hidden="true">·</li>
            <li>{t("trustWhatsApp")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
