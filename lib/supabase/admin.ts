import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/server/env";

let adminClient: SupabaseClient | null = null;

function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase access.");
  }
  return key;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const publicEnv = getPublicEnv();
  adminClient = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    getSupabaseServiceRoleKey(),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  return adminClient;
}
