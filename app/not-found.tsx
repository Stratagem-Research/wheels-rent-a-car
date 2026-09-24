import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { WhatsAppLink } from "@/components/shell/WhatsAppLink";

/**
 * 404 page per 15_legal_and_utility.md.
 *
 * Renders without the marketing shell (this file sits at app/ root, not
 * inside (marketing)/). Slim header + centred message + suggested links.
 */

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("notFoundTitle") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="bg-paper flex min-h-screen flex-col">
      <header className="bg-transparent">
        <div className="mx-auto flex h-14 items-center justify-center px-5 sm:px-10">
          <Link href="/" aria-label="Wheels Rent A Car home" className="headline-md text-ink-100">
            {t("brand")}
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-16 sm:py-20">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="text-ink-60 overline">{t("eyebrow")}</p>
          <h1 className="display-lg text-ink-100 text-[clamp(48px,7vw,72px)] leading-[0.98]">
            {t("heading")}
          </h1>
          <p className="lead-lg text-ink-60 max-w-md">{t("body")}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="cta" size="lg">
              <Link href="/vehicles">{t("browseFleet")}</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
          <p className="label-md text-ink-50 mt-3">
            {t("orChat")}{" "}
            <WhatsAppLink className="text-ink-100 underline-offset-4 hover:underline">
              {t("whatsapp")} →
            </WhatsAppLink>
          </p>
        </div>
      </section>

      <nav
        aria-label="Suggested links"
        className="label-md text-ink-60 mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 pb-12"
      >
        <Link href="/vehicles" className="hover:text-ink-100">
          {t("navVehicles")}
        </Link>
        <Link href="/locations" className="hover:text-ink-100">
          {t("navLocations")}
        </Link>
        <Link href="/help" className="hover:text-ink-100">
          {t("navHelp")}
        </Link>
        <Link href="/contact" className="hover:text-ink-100">
          {t("navContact")}
        </Link>
      </nav>
    </main>
  );
}
