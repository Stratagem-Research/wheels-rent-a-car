import Link from "next/link";
import { WhatsAppFab } from "@/components/shell";
import { SaveAndExitModal } from "@/components/booking/SaveAndExitModal";

/**
 * Slim booking-funnel shell per 00_global.md §2.
 *
 * - Slim header: logo + Save & exit trigger.
 * - Stepper is rendered by each /book/* page so it knows its own step.
 * - Minimal footer (legal links only).
 * - No persistent search bar; the funnel renders its own summary panel.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-border bg-surface sticky top-0 z-30 w-full border-b">
        <div className="mx-auto flex h-14 max-w-[var(--container-full)] items-center justify-between px-5 sm:px-5">
          <Link href="/" aria-label="Wheels Rent A Car home" className="headline-md text-ink-100">
            Wheels
          </Link>
          <SaveAndExitModal>
            <button
              type="button"
              className="label-lg hover:text-ink-95 focus-visible:outline-ink-100 text-ink-60 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Save &amp; exit
            </button>
          </SaveAndExitModal>
        </div>
      </header>
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
