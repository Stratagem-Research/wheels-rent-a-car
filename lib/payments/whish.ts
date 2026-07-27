import { WhishClient, parseCallbackUrl, type WhishCurrency } from "whish-pay";
import { getWhishEnv } from "@/lib/server/env";
import { getWhishEnvironment } from "@/lib/server/payment-methods";

export function getWhishClient() {
  const env = getWhishEnv();
  const environment = getWhishEnvironment();
  return new WhishClient({
    channel: env.WHISH_CHANNEL,
    secret: env.WHISH_SECRET,
    websiteUrl: env.WEBSITE_URL,
    ...(environment === "production" ? { environment: "production" as const } : {}),
  });
}

export { parseCallbackUrl };
export type { WhishCurrency };
