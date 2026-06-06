import { Footer, Header, PromoStrip, WhatsAppFab } from "@/components/shell";
import { getPublicSiteConfig } from "@/lib/server/public-content";

/**
 * Default marketing/customer-facing shell.
 *
 * Used by every public route except booking funnel, auth, and account.
 * The PromoStrip is server-driven via /api/site-config in Sprint 3+;
 * for Sprint 2 we just stub a placeholder campaign string.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getPublicSiteConfig();
  return (
    <>
      {siteConfig.promo ? (
        <PromoStrip
          message={siteConfig.promo.message}
          href={siteConfig.promo.href}
          campaignKey={siteConfig.promo.message.slice(0, 24)}
        />
      ) : null}
      <Header />
      <main id="content" className="min-h-[calc(100vh-160px)]">
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
