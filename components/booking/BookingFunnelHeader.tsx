"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/hooks/useSession";
import { SaveAndExitModal } from "@/components/booking/SaveAndExitModal";

/**
 * Slim funnel header. Save & exit is for in-progress drafts only.
 * Confirmation already submitted the booking and clears the draft, so the
 * header matches 04_booking_flow.md step 5: logo + Sign in / account.
 */
export function BookingFunnelHeader() {
  const pathname = usePathname();
  const isConfirmation = pathname.includes("/book/confirmation");

  return (
    <header className="border-border bg-surface sticky top-0 z-30 w-full border-b">
      <div className="mx-auto flex h-14 max-w-[var(--container-full)] items-center justify-between px-5 sm:px-5">
        <Link href="/" aria-label="Wheels Rent A Car home" className="headline-md text-ink-100">
          Wheels
        </Link>
        {isConfirmation ? <ConfirmationHeaderAction /> : <SaveAndExitTrigger />}
      </div>
    </header>
  );
}

function SaveAndExitTrigger() {
  return (
    <SaveAndExitModal>
      <button
        type="button"
        className="label-lg hover:text-ink-95 focus-visible:outline-ink-100 text-ink-60 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Save &amp; exit
      </button>
    </SaveAndExitModal>
  );
}

function ConfirmationHeaderAction() {
  const { session, ready } = useSession();
  if (!ready) return null;
  if (session) {
    return (
      <Link
        href="/account"
        className="label-lg hover:text-ink-95 focus-visible:outline-ink-100 text-ink-60 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Account
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="label-lg hover:text-ink-95 focus-visible:outline-ink-100 text-ink-60 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Sign in
    </Link>
  );
}
