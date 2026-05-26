import {
  createWheelsInternalClient,
  mapWebsiteSyncToWizardPayload,
  type WebsiteToWizardSyncInput,
} from "@/lib/api/wheels-public";
import { getServerEnv } from "@/lib/server/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function dispatchWizardSync(
  bookingReference: string,
  input: WebsiteToWizardSyncInput,
): Promise<void> {
  const env = getServerEnv();
  const client = createWheelsInternalClient({
    apiToken: env.WHEELS_INTERNAL_API_TOKEN,
    baseUrl: env.WHEELS_INTERNAL_API_BASE_URL,
  });
  const payload = mapWebsiteSyncToWizardPayload(input);

  try {
    await client.syncBookingStatus(bookingReference, payload);
  } catch (error) {
    await logSyncFailure(bookingReference, payload, error);
    throw error;
  }
}

async function logSyncFailure(
  bookingReference: string,
  payload: Record<string, unknown>,
  error: unknown,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("notification_logs").insert({
    booking_reference: bookingReference,
    channel: "wizard-sync",
    status: "failed",
    provider_response: payload,
    error_message: error instanceof Error ? error.message : "Unknown sync error",
  });
}
