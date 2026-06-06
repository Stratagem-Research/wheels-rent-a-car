import { Hero } from "./_components/Hero";
import { Categories } from "./_components/Categories";
import { OurBenefits } from "./_components/OurBenefits";
import { Featured4 } from "./_components/Featured4";
import { ExploreLebanon } from "./_components/ExploreLebanon";
import { ServicePromos } from "./_components/ServicePromos";
import { Reviews } from "./_components/Reviews";
import { NewsletterPopup } from "@/components/consent/NewsletterPopup";
import { REVIEWS } from "@/lib/api/mocks/fixtures/content";
import { getPublicBranches, getPublicVehicles } from "@/lib/server/public-content";

/**
 * Home page — INK & SIGNAL rebuild per /docs/Implementation/landingpage.md.
 *
 * Seven sections in order: Hero (paper canvas + search) → Categories (Rivian
 * wordmarks) → Our Benefits (tinted band) → Featured 4 Cars (inverse band,
 * dark vehicle cards) → Explore Lebanon (editorial tiles) → Service promos
 * (long-term + chauffeur, two dark cards side by side) → Reviews → Footer.
 *
 * (The legacy HeroPromo "Travelers' Choice" inverse block was removed —
 * Categories + Featured4 already carry the inverse-block rhythm and the
 * extra strip was visual noise above the fold.)
 *
 * Server component — data comes directly from mock fixtures during dev. When
 * the real backend lands, these imports become typed fetch() calls.
 */

export const metadata = {
  title: "Wheels Rent A Car — Premium Car Rental in Lebanon · Free Hazmieh Pickup",
  description:
    "Premium car rental in Lebanon. Free Hazmieh pickup. WhatsApp support 24/7. Free cancellation up to 24 hours. Book in under 90 seconds.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Wheels Rent A Car",
      url: "https://wheelsrentacar.com.lb",
      logo: "https://wheelsrentacar.com.lb/images/Logo/wheels-logo.svg",
      sameAs: ["https://instagram.com/", "https://facebook.com/", "https://linkedin.com/"],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+961-1-629100",
          contactType: "customer service",
          availableLanguage: ["en"],
          areaServed: "LB",
        },
      ],
    },
    {
      "@type": "WebSite",
      url: "https://wheelsrentacar.com.lb",
      name: "Wheels Rent A Car",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://wheelsrentacar.com.lb/book/select-vehicle?{search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function Home() {
  const branches = await getPublicBranches();
  const vehicles = await getPublicVehicles();
  const featuredVehicles = vehicles.slice(0, 4);
  // Reviews now marquees infinitely — pass the full list so the loop has
  // enough content to look continuous rather than three cards on repeat.
  const reviews = REVIEWS;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero branches={branches} />
      <Categories />
      <OurBenefits />
      <Featured4 vehicles={featuredVehicles} />
      <ExploreLebanon />
      <ServicePromos />
      <Reviews reviews={reviews} />
      <NewsletterPopup />
    </>
  );
}
