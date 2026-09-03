import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatStrip } from "@/components/about/StatStrip";
import { TeamGrid } from "@/components/about/TeamGrid";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { getPublicAboutContent, getPublicBranches } from "@/lib/server/public-content";
import { getLocalizedString, getLocalizedStringArray } from "@/lib/i18n/localized";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/about",
    locale,
    fallbackTitle: t("aboutTitle"),
    fallbackDescription: t("aboutDescription"),
    path: "/about",
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("about");
  const branches = await getPublicBranches();
  const about = await getPublicAboutContent();
  const storyParagraphs = getLocalizedStringArray(about.storyParagraphs, locale);
  const fleetParagraphs = getLocalizedStringArray(about.fleetPhilosophy.paragraphs, locale);
  const stats = about.stats.map((item) => ({
    value: item.value,
    label: getLocalizedString(item.label, locale),
  }));
  const team = about.team.map((member) => ({
    ...member,
    role: getLocalizedString(member.role, locale),
    quote: member.quote ? getLocalizedString(member.quote, locale) : undefined,
    bio: getLocalizedString(member.bio, locale),
    highlights: member.highlights ? getLocalizedStringArray(member.highlights, locale) : [],
  }));
  return (
    <>
      {/* Cinematic photo-backed editorial hero — see lib/marketing/hero-images.ts. */}
      <PageHero
        overline={t("eyebrow")}
        headline={
          <>
            {t("heroLine1")}
            <br />
            {t("heroLine2")}
          </>
        }
        headlineClassName="display-2xl text-[clamp(48px,7vw,96px)] leading-[0.96]"
        lead={t("heroSubtitle")}
        image={PAGE_HERO_IMAGES.about}
      />

      {/* Editorial story block — image left, copy right. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center">
            <div className="bg-ink-10 relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg"
                alt={t("heroImageAlt")}
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="headline-lg text-ink-100">{t("ourStory")}</h2>
              <div className="body-lg text-ink-80 mt-6 flex flex-col gap-5 leading-relaxed">
                {storyParagraphs.slice(0, 2).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <blockquote className="border-ink-100 my-10 border-l-2 pl-6">
                <p className="headline-md text-ink-100 italic">
                  “{getLocalizedString(about.pullQuote, locale)}”
                </p>
              </blockquote>
              <div className="body-lg text-ink-80 flex flex-col gap-5 leading-relaxed">
                {storyParagraphs.slice(2).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatStrip stats={stats} />

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <h2 className="headline-lg text-ink-100">
                {getLocalizedString(about.fleetPhilosophy.heading, locale)}
              </h2>
              <div className="body-lg text-ink-80 mt-5 flex flex-col gap-4 leading-relaxed">
                {fleetParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="bg-ink-10 relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="/images/Trips Images/cedars.jpg"
                alt={t("cedarsImageAlt")}
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">{t("theTeam")}</h2>
          <p className="body-lg text-ink-80 mt-6 max-w-4xl leading-relaxed">
            {getLocalizedString(about.teamIntro, locale)}
          </p>
          <p className="body-md text-ink-80 mt-4 max-w-4xl leading-relaxed italic">
            {getLocalizedString(about.teamDedication, locale)}
          </p>
          <TeamGrid members={team} />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex items-baseline justify-between">
            <h2 className="headline-lg text-ink-100">{t("findUs")}</h2>
            <Link
              href="/locations"
              className="label-lg text-ink-100 underline-offset-4 hover:underline"
            >
              {t("visitBranch")} →
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:gap-4">
            {branches.map((b) => (
              <li key={b.id}>
                <Link href="/locations">
                  <Card variant="default" hoverable className="flex h-full flex-col gap-1">
                    <span className="headline-sm text-ink-100">{b.name}</span>
                    <span className="body-sm text-ink-60 mt-1">{b.address}</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink-100 text-paper">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-10 lg:py-24">
          <h2 className="headline-lg text-paper">{t("ctaHeading")}</h2>
          <p className="lead-md text-ink-30">{t("ctaSubtitle")}</p>
          <Button asChild variant="cta" size="lg" className="mt-2">
            <Link href="/vehicles">{t("browseCars")}</Link>
          </Button>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Wheels Rent A Car",
            url: "/",
            founder: { "@type": "Person", name: "Marc Khamis" },
            address: { "@type": "PostalAddress", addressCountry: "LB" },
            sameAs: [
              "https://instagram.com/wheelsrentacar",
              "https://facebook.com/wheelsrentacar",
              "https://linkedin.com/company/wheelsrentacar",
            ],
          }),
        }}
      />
    </>
  );
}
