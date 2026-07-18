import { WhishClient, parseCallbackUrl, type WhishCurrency } from "whish-pay";
import { getWhishEnv } from "@/lib/server/env";

export function getWhishClient() {
  const env = getWhishEnv();
  return new WhishClient({
    channel: env.WHISH_CHANNEL,
    secret: env.WHISH_SECRET,
    websiteUrl: env.WEBSITE_URL,
  });
}

export { parseCallbackUrl };
export type { WhishCurrency };
