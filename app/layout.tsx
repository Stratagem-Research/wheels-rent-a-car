import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Suspense } from "react";
import { RouteProgressBar, SkipToContent, ToastProvider } from "@/components/ui";
import { MswProvider } from "@/lib/api/mocks/MswProvider";
import { CookieBanner } from "@/components/consent/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wheels Rent A Car — Premium Car Rental in Lebanon",
  description:
    "Rent a premium car in Lebanon. Pickup at our Hazmieh hub, 24/7 WhatsApp support, free cancellation. Book online in under 90 seconds.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MswProvider>
            <SkipToContent />
            <Suspense fallback={null}>
              <RouteProgressBar />
            </Suspense>
            {children}
            <ToastProvider />
            <CookieBanner />
          </MswProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
