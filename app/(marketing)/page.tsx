import { Hero } from "./_components/Hero";
import { Categories } from "./_components/Categories";
import { OurBenefits } from "./_components/OurBenefits";
import { Featured4 } from "./_components/Featured4";
import { ExploreLebanon } from "./_components/ExploreLebanon";
import { ServicePromos } from "./_components/ServicePromos";
import { Reviews } from "./_components/Reviews";
import { getTranslations } from "next-intl/server";
import { NewsletterPopup } from "@/components/consent/NewsletterPopup";
import { getPublicBranches, getPublicReviews, getPublicVehicles } from "@/lib/server/public-content";

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
 * Server component — content resolves through the website repositories and
 * their explicit seed-data fallbacks.
 */

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("homeTitle"), description: t("homeDescription") };
}

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
  const reviews = await getPublicReviews(20);

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
