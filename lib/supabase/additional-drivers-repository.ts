import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { findBookingDocumentScans, signedStorageUrl } from "@/lib/supabase/booking-document-scans";

export type AdditionalDriverRecord = {
  firstName: string;
  lastName: string;
  scanFrontUrl?: string;
  scanBackUrl?: string;
};

type Row = {
  first_name: string;
  last_name: string;
  storage_path_front: string | null;
  storage_path_back: string | null;
};

async function signedUrl(
  supabase: SupabaseClient,
  path: string | null,
): Promise<string | undefined> {
  if (!path) return undefined;
  const { data } = await supabase.storage.from("user-documents").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

/** Name + signed scans from the vault, overlaying booking columns when the vault is empty. */
export async function resolveAdditionalDriverForAccount(
  supabase: SupabaseClient,
  userId: string,
  email?: string,
): Promise<AdditionalDriverRecord | null> {
  const existing = await getAdditionalDriver(supabase, userId);
  const scans = await findBookingDocumentScans({ userId, email });
  const [bookingFront, bookingBack] = await Promise.all([
    signedStorageUrl(scans.additionalFrontPath),
    signedStorageUrl(scans.additionalBackPath),
  ]);
  const firstName = existing?.firstName || scans.additionalFirstName || "";
  const lastName = existing?.lastName || scans.additionalLastName || "";
  const scanFrontUrl = existing?.scanFrontUrl || bookingFront;
  const scanBackUrl = existing?.scanBackUrl || bookingBack;
  if (!firstName && !lastName && !scanFrontUrl && !scanBackUrl) return null;
  return { firstName, lastName, scanFrontUrl, scanBackUrl };
}

export async function getAdditionalDriverStoragePaths(userId: string): Promise<{
  firstName: string;
  lastName: string;
  frontPath: string | null;
  backPath: string | null;
} | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("additional_drivers")
    .select("first_name, last_name, storage_path_front, storage_path_back")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Row;
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    frontPath: row.storage_path_front,
    backPath: row.storage_path_back,
  };
}

export async function getAdditionalDriver(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdditionalDriverRecord | null> {
  const { data, error } = await supabase
    .from("additional_drivers")
    .select("first_name, last_name, storage_path_front, storage_path_back")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Row;
  const [scanFrontUrl, scanBackUrl] = await Promise.all([
    signedUrl(supabase, row.storage_path_front),
    signedUrl(supabase, row.storage_path_back),
  ]);
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    scanFrontUrl,
    scanBackUrl,
  };
}

export async function upsertAdditionalDriver(
  supabase: SupabaseClient,
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    storagePathFront?: string | null;
    storagePathBack?: string | null;
  },
): Promise<void> {
  const existing = await supabase
    .from("additional_drivers")
    .select("storage_path_front, storage_path_back")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("additional_drivers").upsert(
    {
      user_id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      storage_path_front: input.storagePathFront ?? existing.data?.storage_path_front ?? null,
      storage_path_back: input.storagePathBack ?? existing.data?.storage_path_back ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function backfillAdditionalDriverFromBooking(
  supabase: SupabaseClient,
  userId: string,
  email?: string,
): Promise<AdditionalDriverRecord | null> {
  try {
    const existing = await getAdditionalDriver(supabase, userId);
    if (existing?.scanFrontUrl || existing?.scanBackUrl) return existing;

    const scans = await findBookingDocumentScans({ userId, email });
    if (!scans.additionalFrontPath && !scans.additionalBackPath && !scans.additionalFirstName) {
      return existing;
    }

    await upsertAdditionalDriver(supabase, userId, {
      firstName: scans.additionalFirstName || existing?.firstName || "",
      lastName: scans.additionalLastName || existing?.lastName || "",
      storagePathFront: scans.additionalFrontPath,
      storagePathBack: scans.additionalBackPath,
    });
    return getAdditionalDriver(supabase, userId);
  } catch {
    return null;
  }
}
