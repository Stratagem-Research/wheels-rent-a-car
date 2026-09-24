import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Suspense } from "react";
import { RouteProgressBar, SkipToContent, ToastProvider } from "@/components/ui";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { SavedVehiclesProvider } from "@/components/providers/SavedVehiclesProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ContactSettingsProvider } from "@/components/providers/ContactSettingsProvider";
import { isRtlLocale, routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/server/env";
import { getPublicContactSettings } from "@/lib/server/public-content";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // No title.template: every page's title (translated or admin-edited via
  // /admin/seo) already embeds "· Wheels Rent A Car" itself — a template
  // would double it up.
  title: "Wheels Rent A Car · Premium Car Rental in Lebanon",
  description:
    "Rent a premium car in Lebanon. Pickup at our Hazmieh hub, 24/7 WhatsApp support, free cancellation. Book online in under 90 seconds.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    languages: {
      en: "/en",
      ar: "/ar",
      fr: "/fr",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Wheels Rent A Car",
    images: [
      {
        url: encodeURI("/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg"),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const contactSettings = await getPublicContactSettings();
  const direction = isRtlLocale(locale) ? "rtl" : "ltr";
  const language = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  return (
    <html lang={language} dir={direction} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ContactSettingsProvider settings={contactSettings}>
            <SessionProvider>
              <SavedVehiclesProvider>
                <SkipToContent />
                <Suspense fallback={null}>
                  <RouteProgressBar />
                </Suspense>
                {children}
                <ToastProvider />
                <CookieBanner />
              </SavedVehiclesProvider>
            </SessionProvider>
          </ContactSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
