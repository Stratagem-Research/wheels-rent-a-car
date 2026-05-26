import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * 404 page per 15_legal_and_utility.md.
 *
 * Renders without the marketing shell (this file sits at app/ root, not
 * inside (marketing)/). Slim header + centred message + suggested links.
 */

export const metadata = {
  title: "Wrong turn — page not found · Wheels",
};

export default function NotFound() {
  return (
    <main className="bg-paper flex min-h-screen flex-col">
      <header className="bg-transparent">
        <div className="mx-auto flex h-14 items-center justify-center px-5 sm:px-10">
          <Link href="/" aria-label="Wheels Rent A Car home" className="headline-md text-ink-100">
            Wheels
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-16 sm:py-20">
        <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="text-ink-60 overline">404</p>
          <h1 className="display-lg text-ink-100 text-[clamp(48px,7vw,72px)] leading-[0.98]">
            Wrong turn.
          </h1>
          <p className="lead-lg text-ink-60 max-w-md">
            The page you were looking for doesn&apos;t exist or has moved.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="cta" size="lg">
              <Link href="/vehicles">Browse our fleet</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
          <p className="label-md text-ink-50 mt-3">
            Or chat with us on{" "}
            <a
              href={whatsAppHref("default")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-100 underline-offset-4 hover:underline"
            >
              WhatsApp →
            </a>
          </p>
        </div>
      </section>

      <nav
        aria-label="Suggested links"
        className="label-md text-ink-60 mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 pb-12"
      >
        <Link href="/vehicles" className="hover:text-ink-100">
          Vehicles
        </Link>
        <Link href="/locations" className="hover:text-ink-100">
          Locations
        </Link>
        <Link href="/help" className="hover:text-ink-100">
          Help
        </Link>
        <Link href="/contact" className="hover:text-ink-100">
          Contact
        </Link>
      </nav>
    </main>
  );
}
