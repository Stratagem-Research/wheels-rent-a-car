import { getNeoEnvironment, type PaymentEnvironment } from "@/lib/server/payment-methods";

export interface NeoCreatePaymentInput {
  amount: number;
  currency: "USD" | "LBP";
  invoice: string;
  externalId: number;
  successCallbackUrl: string;
  failureCallbackUrl: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

export interface NeoCreatePaymentResult {
  success: boolean;
  collectUrl?: string;
  message?: string;
}

export interface NeoClientOptions {
  merchantId: string;
  apiKey: string;
  websiteUrl: string;
  environment: PaymentEnvironment;
}

/**
 * Bank Audi NEO payment scaffold.
 * Sandbox mode simulates a hosted checkout redirect until merchant API docs/credentials
 * are wired to the live NEO endpoints.
 */
export class NeoClient {
  constructor(private readonly options: NeoClientOptions) {}

  generateExternalId(): number {
    return Date.now();
  }

  async createPayment(input: NeoCreatePaymentInput): Promise<NeoCreatePaymentResult> {
    if (this.options.environment === "sandbox") {
      const collectUrl = new URL(input.successCallbackUrl);
      collectUrl.searchParams.set("external_id", String(input.externalId));
      collectUrl.searchParams.set("sandbox", "1");
      collectUrl.searchParams.set("amount", String(input.amount));
      collectUrl.searchParams.set("currency", input.currency);
      collectUrl.searchParams.set("redirect", input.successRedirectUrl);
      return { success: true, collectUrl: collectUrl.toString() };
    }

    // Production placeholder — replace with the official NEO API once credentials are issued.
    return {
      success: false,
      message:
        "Bank Audi NEO production checkout is not wired yet. Use sandbox mode or contact Wheels ops.",
    };
  }
}

export function getNeoClient(): NeoClient {
  const merchantId = process.env.NEO_MERCHANT_ID?.trim();
  const apiKey = process.env.NEO_API_KEY?.trim();
  const websiteUrl = process.env.WEBSITE_URL?.trim();
  if (!merchantId || !apiKey || !websiteUrl) {
    throw new Error("NEO payment is not configured.");
  }
  return new NeoClient({
    merchantId,
    apiKey,
    websiteUrl,
    environment: getNeoEnvironment(),
  });
}
