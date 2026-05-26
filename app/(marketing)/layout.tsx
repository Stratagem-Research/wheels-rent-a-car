import { Footer, Header, PromoStrip, WhatsAppFab } from "@/components/shell";

/**
 * Default marketing/customer-facing shell.
 *
 * Used by every public route except booking funnel, auth, and account.
 * The PromoStrip is server-driven via /api/site-config in Sprint 3+;
 * for Sprint 2 we just stub a placeholder campaign string.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoStrip
        message="Summer in Lebanon — 15% off on weekly rentals. Code SUMMER15 →"
        href="/vehicles?promo=SUMMER15"
        campaignKey="summer15"
      />
      <Header />
      <main id="content" className="min-h-[calc(100vh-160px)]">
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
