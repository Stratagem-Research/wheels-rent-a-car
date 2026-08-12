import Link from "next/link";
import { WhatsAppFab } from "@/components/shell";
import { BookingFunnelHeader } from "@/components/booking/BookingFunnelHeader";

/**
 * Slim booking-funnel shell per 00_global.md §2.
 *
 * - Slim header: logo + Save & exit (funnel) or Sign in (confirmation).
 * - Stepper is rendered by each /book/* page so it knows its own step.
 * - Minimal footer (legal links only).
 * - No persistent search bar; the funnel renders its own summary panel.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BookingFunnelHeader />
      <main id="content" className="min-h-[calc(100vh-120px)]">
        {children}
      </main>
      <footer className="border-border bg-surface border-t">
        <div className="label-md text-ink-60 mx-auto flex max-w-[var(--container-full)] flex-col-reverse items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-5">
          <span>© {new Date().getFullYear()} Wheels Rent A Car</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink-80">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink-80">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-ink-80">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
      <WhatsAppFab />
    </>
  );
}
