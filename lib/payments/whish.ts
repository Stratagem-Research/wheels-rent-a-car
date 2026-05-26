import { WhishClient, parseCallbackUrl, type WhishCurrency } from "whish-pay";
import { getServerEnv } from "@/lib/server/env";

export function getWhishClient() {
  const env = getServerEnv();
  return new WhishClient({
    channel: env.WHISH_CHANNEL,
    secret: env.WHISH_SECRET,
    websiteUrl: env.WEBSITE_URL,
  });
}

export { parseCallbackUrl };
export type { WhishCurrency };
