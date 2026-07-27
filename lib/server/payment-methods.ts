import type { PaymentMethod } from "@/types/domain";

export type PaymentEnvironment = "sandbox" | "production";

export interface PaymentMethodConfig {
  method: PaymentMethod;
  /** Shown in checkout when true. */
  enabled: boolean;
  /** Online methods can be enabled but unavailable until credentials are set. */
  available: boolean;
  environment?: PaymentEnvironment;
}

const ONLINE_METHODS = new Set<PaymentMethod>(["whish-online", "neo"]);

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function parseEnvironment(value: string | undefined, fallback: PaymentEnvironment): PaymentEnvironment {
  const normalized = value?.trim().toLowerCase();
  return normalized === "production" ? "production" : fallback;
}

function hasWhishCredentials(): boolean {
  const channel = process.env.WHISH_CHANNEL?.trim();
  const secret = process.env.WHISH_SECRET?.trim();
  if (!channel || !secret) return false;
  return !channel.startsWith("replace-with") && !secret.startsWith("replace-with");
}

function hasNeoCredentials(): boolean {
  const merchantId = process.env.NEO_MERCHANT_ID?.trim();
  const apiKey = process.env.NEO_API_KEY?.trim();
  if (!merchantId || !apiKey) return false;
  return !merchantId.startsWith("replace-with") && !apiKey.startsWith("replace-with");
}

export function getWhishEnvironment(): PaymentEnvironment {
  return parseEnvironment(process.env.WHISH_ENVIRONMENT, "sandbox");
}

export function getNeoEnvironment(): PaymentEnvironment {
  return parseEnvironment(process.env.NEO_ENVIRONMENT, "sandbox");
}

export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  switch (method) {
    case "cash":
      return parseBooleanEnv(process.env.PAYMENT_METHOD_CASH, true);
    case "transfer":
      return parseBooleanEnv(process.env.PAYMENT_METHOD_TRANSFER, true);
    case "omt":
      return parseBooleanEnv(process.env.PAYMENT_METHOD_OMT, true);
    case "whish-online":
      return parseBooleanEnv(process.env.PAYMENT_METHOD_WHISH_ONLINE, false);
    case "neo":
      return parseBooleanEnv(process.env.PAYMENT_METHOD_NEO, false);
    case "card":
      return false;
    default:
      return false;
  }
}

export function isPaymentMethodAvailable(method: PaymentMethod): boolean {
  if (!isPaymentMethodEnabled(method)) return false;
  if (method === "whish-online") return hasWhishCredentials();
  if (method === "neo") return hasNeoCredentials();
  return true;
}

/** Checkout-visible methods in display order. */
export function getCheckoutPaymentMethods(): PaymentMethodConfig[] {
  const order: PaymentMethod[] = ["cash", "transfer", "omt", "whish-online", "neo"];
  return order.map((method) => ({
    method,
    enabled: isPaymentMethodEnabled(method),
    available: isPaymentMethodAvailable(method),
    ...(method === "whish-online"
      ? { environment: getWhishEnvironment() }
      : method === "neo"
        ? { environment: getNeoEnvironment() }
        : {}),
  }));
}

export function getEnabledCheckoutPaymentMethods(): PaymentMethod[] {
  return getCheckoutPaymentMethods()
    .filter((item) => item.enabled && (ONLINE_METHODS.has(item.method) ? item.available : true))
    .map((item) => item.method);
}

export function assertPaymentMethodSelectable(method: PaymentMethod): void {
  if (!isPaymentMethodEnabled(method)) {
    throw new Error(`Payment method "${method}" is disabled.`);
  }
  if (!isPaymentMethodAvailable(method)) {
    throw new Error(`Payment method "${method}" is not configured.`);
  }
}
