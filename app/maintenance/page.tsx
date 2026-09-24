import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WhatsAppLink } from "@/components/shell/WhatsAppLink";

export async function generateMetadata() {
  const t = await getTranslations("maintenance");
  return { title: `${t("heading")} · Wheels`, robots: { index: false, follow: false } };
}

/**
 * /maintenance per 15_legal_and_utility.md. Toggled via the
 * NEXT_PUBLIC_MAINTENANCE_MODE env var; the Next.js middleware
 * (middleware.ts) routes every non-static request here when enabled.
 *
 * Admins (cookie wheels.admin=1) bypass the route — used to validate
 * a fix before flipping the flag off.
 *
 * Sends HTTP 503 + Retry-After header so search engines understand
 * this is transient.
 */
export default async function MaintenancePage() {
  const t = await getTranslations("maintenance");
  return (
    <main className="bg-paper flex min-h-screen flex-col">
      <header className="bg-transparent">
        <div className="mx-auto flex h-14 items-center justify-center px-5 sm:px-10">
          <span className="headline-md text-ink-100">{t("brand")}</span>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-16 sm:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="text-ink-60 overline">{t("eyebrow")}</p>
          <h1 className="display-lg text-ink-100 text-[clamp(48px,7vw,72px)] leading-[0.98]">
            {t("heading")}
          </h1>
          <p className="lead-lg text-ink-60 max-w-md">{t("body")}</p>
          <p className="label-md text-ink-50 mt-3">
            {t("needToBook")}{" "}
            <WhatsAppLink className="text-ink-100 underline-offset-4 hover:underline">
              {t("messageWhatsapp")} →
            </WhatsAppLink>
          </p>
        </div>
      </section>

      <footer className="bg-transparent">
        <div className="label-md text-ink-60 mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-6">
          <Link href="/privacy" className="hover:text-ink-100">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-ink-100">
            {t("terms")}
          </Link>
        </div>
      </footer>
    </main>
  );
}
