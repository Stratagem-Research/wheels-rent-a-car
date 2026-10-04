import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const TABLE = "admin_sessions";

export async function insertAdminSession(input: {
  id: string;
  username: string;
  role: string;
  expiresAt: Date;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).insert({
    id: input.id,
    username: input.username,
    role: input.role,
    expires_at: input.expiresAt.toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** True while the session exists, isn't revoked and hasn't expired. */
export async function isAdminSessionActive(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function revokeAdminSession(id: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);
  if (error) throw new Error(error.message);
}

/** Housekeeping: drop rows that can no longer authorize anything. */
export async function purgeExpiredAdminSessions(): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).delete().lt("expires_at", new Date().toISOString());
  if (error) throw new Error(error.message);
}
