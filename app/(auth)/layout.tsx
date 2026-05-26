import Link from "next/link";

/**
 * Slim auth shell per 14_auth.md.
 *
 * Centered single-column layout, no global header nav, minimal footer.
 * Deliberately quiet: no distractions, no WhatsApp FAB.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink-10 flex min-h-screen flex-col">
      <header className="bg-transparent">
        <div className="mx-auto flex h-14 max-w-[var(--container-default)] items-center justify-center px-5 sm:px-10">
          <Link href="/" aria-label="Wheels Rent A Car home" className="headline-md text-ink-100">
            Wheels
          </Link>
        </div>
      </header>
      <main id="content" className="flex flex-1 items-start justify-center px-5 py-12 sm:py-16">
        {children}
      </main>
      <footer className="bg-transparent">
        <div className="label-md text-ink-60 mx-auto flex flex-col items-center gap-2 px-5 py-6 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/privacy" className="hover:text-ink-80">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-80">
            Terms
          </Link>
          <Link href="/help" className="hover:text-ink-80">
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}
