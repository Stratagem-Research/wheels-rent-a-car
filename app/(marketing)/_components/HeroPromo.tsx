import { Reveal } from "@/components/motion/Reveal";
import { InversePromoBlock } from "@/components/landing/InversePromoBlock";

/**
 * Hero promo strip — landingpage.md §1.2 "Travelers' Choice" inverse block.
 *
 * Sits directly below the search card. The Phase-1 copy markets the
 * Hazmieh hub as the trustworthy pickup point.
 */
export function HeroPromo() {
  return (
    <Reveal as="section" className="bg-paper">
      <div className="mx-auto max-w-[var(--container-default)] px-5 pb-12 sm:px-10 lg:pb-16">
        <InversePromoBlock
          eyebrow="Travelers' choice"
          headline={
            <>
              The cars you
              <br />
              trust at Hazmieh.
            </>
          }
          body="Free pickup. Brand-new fleet. WhatsApp support. Drive in under 15 minutes from the moment you arrive."
          ctaLabel="Browse fleet"
          ctaHref="/vehicles"
          image={{
            src: "/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg",
            alt: "A premium Wheels rental car parked along the Lebanese coast",
            width: 1280,
            height: 960,
          }}
        />
      </div>
    </Reveal>
  );
}
