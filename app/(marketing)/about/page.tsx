import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatStrip } from "@/components/about/StatStrip";
import { TeamGrid } from "@/components/about/TeamGrid";
import { getPublicAboutContent, getPublicBranches } from "@/lib/server/public-content";

export const metadata = {
  title: "About Wheels Rent A Car · Premium Car Rental in Lebanon",
  description:
    "Wheels is a premium car rental brand built in Beirut. Meet the team and learn how we run our fleet across Lebanon.",
};

export default async function AboutPage() {
  const branches = await getPublicBranches();
  const about = await getPublicAboutContent();
  return (
    <>
      {/* Editorial inverse hero — display-2xl headline, no decoration. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">About Wheels</p>
          <h1 className="display-2xl text-paper mt-4 text-[clamp(48px,7vw,96px)] leading-[0.96]">
            We pick you up.
            <br />
            We wait for you.
          </h1>
          <p className="lead-lg text-ink-30 mt-6 max-w-2xl">
            Premium car rental, run by Lebanese, designed for the way people actually travel here.
          </p>
        </div>
      </header>

      {/* Editorial story block — image left, copy right. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center">
            <div className="bg-ink-10 relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg"
                alt="Raouche rocks at sunset in Beirut"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="headline-lg text-ink-100">Our story</h2>
              <div className="body-lg text-ink-80 mt-6 flex flex-col gap-5 leading-relaxed">
                {about.storyParagraphs.slice(0, 2).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <blockquote className="border-ink-100 my-10 border-l-2 pl-6">
                <p className="headline-md text-ink-100 italic">“{about.pullQuote}”</p>
              </blockquote>
              <div className="body-lg text-ink-80 flex flex-col gap-5 leading-relaxed">
                {about.storyParagraphs.slice(2).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatStrip stats={about.stats} />

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div>
              <h2 className="headline-lg text-ink-100">{about.fleetPhilosophy.heading}</h2>
              <div className="body-lg text-ink-80 mt-5 flex flex-col gap-4 leading-relaxed">
                {about.fleetPhilosophy.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="bg-ink-10 relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="/images/Trips Images/cedars.jpg"
                alt="A drive through the Cedars in Lebanon"
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
          <h2 className="headline-lg text-ink-100">The team</h2>
          <p className="body-lg text-ink-80 mt-6 max-w-4xl leading-relaxed">{about.teamIntro}</p>
          <p className="body-md text-ink-80 mt-4 max-w-4xl leading-relaxed italic">
            {about.teamDedication}
          </p>
          <TeamGrid members={about.team} />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex items-baseline justify-between">
            <h2 className="headline-lg text-ink-100">Find us</h2>
            <Link
              href="/locations"
              className="label-lg text-ink-100 underline-offset-4 hover:underline"
            >
              Visit our branch →
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
          <h2 className="headline-lg text-paper">Want to drive with us?</h2>
          <p className="lead-md text-ink-30">Book your car in under 90 seconds.</p>
          <Button asChild variant="cta" size="lg" className="mt-2">
            <Link href="/vehicles">Browse cars</Link>
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
