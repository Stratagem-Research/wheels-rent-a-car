import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Self-contained server bundle for Node hosts (Plesk/Passenger, Docker).
  // Produces .next/standalone/server.js — the app startup file on Plesk.
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 720, 1080, 1280, 1536],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  typedRoutes: true,
};

export default withNextIntl(nextConfig);
