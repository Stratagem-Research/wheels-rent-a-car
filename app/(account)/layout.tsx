import { Footer, Header, WhatsAppFab } from "@/components/shell";
import { AccountNav } from "./_components/AccountNav";

/**
 * Account shell per 12_account.md + Phase 10 INK & SIGNAL repaint.
 *
 * 2-column desktop layout: sticky left sidebar nav (`<AccountNav />`) + page
 * content on the right. Mobile: sidebar collapses to a horizontal scroll of
 * pill links above the content.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main
        id="content"
        className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 sm:py-12"
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0 lg:self-start">
            <AccountNav />
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
