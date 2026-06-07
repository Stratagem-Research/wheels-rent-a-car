"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookingLookupForm } from "@/components/account/BookingLookupForm";
import { BookingDetailPanel } from "@/components/account/BookingDetailPanel";
import { useSession } from "@/hooks/useSession";
import { whatsAppHref } from "@/lib/whatsapp";
import type { Booking } from "@/types/domain";

/**
 * /manage-booking — guest booking lookup per 13_manage_booking.md.
 *
 * Phase 9 repaint: inverse hero with display-xl, paper-canvas lookup card,
 * single red CTA on the lookup form submit.
 *
 * Signed-in users redirect to /account/bookings (the account UI is richer
 * with the full bookings list + filters).
 */
export default function ManageBookingPage() {
  const t = useTranslations("manageBooking");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready } = useSession();
  const [booking, setBooking] = React.useState<Booking | null>(null);

  // Redirect signed-in users to the account flow once we know they're in.
  React.useEffect(() => {
    if (!ready) return;
    if (session) router.replace("/account/bookings");
  }, [ready, session, router]);

  if (!ready || session) {
    return null;
  }

  return (
    <>
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-20">
          <p className="text-ink-40 overline">{t("eyebrow")}</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(40px,6vw,72px)] leading-[0.98]">
            {t("heroHeading")}
          </h1>
          <p className="lead-lg text-ink-30 mt-4 max-w-2xl">{t("heroSubtitle")}</p>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-2xl px-5 py-16 sm:px-10 lg:py-20">
          {booking ? (
            <div className="flex flex-col gap-6">
              <BookingDetailPanel booking={booking} />
              <AccountUpsell email={booking.driver.email} />
            </div>
          ) : (
            <Card variant="default" className="flex flex-col gap-5 rounded-xl p-8">
              <h2 className="headline-lg text-ink-100">{t("lookupHeading")}</h2>
              <BookingLookupForm
                defaultRef={searchParams?.get("ref") ?? ""}
                defaultEmail={searchParams?.get("email") ?? ""}
                onSuccess={setBooking}
              />
              <hr className="border-border" />
              <div className="flex flex-col items-start gap-1">
                <span className="label-md text-ink-50">{t("lostReference")}</span>
                <a
                  href={whatsAppHref("default")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-lg text-ink-100 underline-offset-4 hover:underline"
                >
                  {t("chatOnWhatsapp")} →
                </a>
              </div>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}

function AccountUpsell({ email }: { email: string }) {
  const t = useTranslations("manageBooking");
  return (
    <Card
      variant="inverse"
      className="flex flex-col gap-4 rounded-xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 className="headline-sm">{t("upsellHeading")}</h2>
        <p className="body-sm text-ink-30 mt-2">{t("upsellBody")}</p>
      </div>
      <Button asChild variant="primary-inverse" size="md">
        <Link href={`/register?email=${encodeURIComponent(email)}`}>{t("createAccount")}</Link>
      </Button>
    </Card>
  );
}
