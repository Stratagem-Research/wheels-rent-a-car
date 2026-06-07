import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { InversePromoBlock } from "@/components/landing/InversePromoBlock";

/**
 * Hero promo strip — landingpage.md §1.2 "Travelers' Choice" inverse block.
 *
 * Sits directly below the search card. The Phase-1 copy markets the
 * Hazmieh hub as the trustworthy pickup point.
 */
export async function HeroPromo() {
  const t = await getTranslations("landing.heroPromo");
  return (
    <Reveal as="section" className="bg-paper">
      <div className="mx-auto max-w-[var(--container-default)] px-5 pb-12 sm:px-10 lg:pb-16">
        <InversePromoBlock
          eyebrow={t("eyebrow")}
          headline={
            <>
              {t("headlineLine1")}
              <br />
              {t("headlineLine2")}
            </>
          }
          body={t("body")}
          ctaLabel={t("cta")}
          ctaHref="/vehicles"
          image={{
            src: "/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg",
            alt: t("imageAlt"),
            width: 1280,
            height: 960,
          }}
        />
      </div>
    </Reveal>
  );
}
