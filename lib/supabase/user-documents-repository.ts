import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentStatus, DocumentType, UserDocument } from "@/types/domain";
import { findBookingDocumentScans } from "@/lib/supabase/booking-document-scans";

type DocumentRow = {
  id: string;
  user_id: string;
  type: DocumentType;
  number: string;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_country: string;
  storage_path: string | null;
  storage_path_front: string | null;
  storage_path_back: string | null;
  status: DocumentStatus;
  uploaded_at: string;
};

async function signedUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<string | undefined> {
  if (!path) return undefined;
  const { data } = await supabase.storage.from("user-documents").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

function toUserDocument(
  row: DocumentRow,
  urls: { scanUrl?: string; scanFrontUrl?: string; scanBackUrl?: string },
): UserDocument {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    number: row.number,
    issueDate: row.issue_date ?? "",
    expiryDate: row.expiry_date ?? "",
    issuingCountry: row.issuing_country,
    scanUrl: urls.scanUrl ?? urls.scanFrontUrl,
    scanFrontUrl: urls.scanFrontUrl,
    scanBackUrl: urls.scanBackUrl,
    status: row.status,
    uploadedAt: row.uploaded_at,
  };
}

export async function listUserDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as DocumentRow[];
  const docs: UserDocument[] = [];

  for (const row of rows) {
    const frontPath = row.storage_path_front ?? row.storage_path;
    const [scanFrontUrl, scanBackUrl, scanUrl] = await Promise.all([
      signedUrl(supabase, frontPath),
      signedUrl(supabase, row.storage_path_back),
      signedUrl(supabase, row.storage_path),
    ]);
    docs.push(toUserDocument(row, { scanUrl: scanUrl ?? scanFrontUrl, scanFrontUrl, scanBackUrl }));
  }

  return docs;
}

export async function findUserDocument(
  supabase: SupabaseClient,
  userId: string,
  type: DocumentType,
): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  if (error) throw error;
  return (data as DocumentRow | null) ?? null;
}

export async function upsertUserDocument(
  supabase: SupabaseClient,
  userId: string,
  input: {
    type: DocumentType;
    number: string;
    issueDate: string;
    expiryDate: string;
    issuingCountry: string;
    storagePath?: string | null;
    storagePathFront?: string | null;
    storagePathBack?: string | null;
  },
): Promise<UserDocument> {
  const { data, error } = await supabase
    .from("user_documents")
    .upsert(
      {
        user_id: userId,
        type: input.type,
        number: input.number,
        issue_date: input.issueDate || null,
        expiry_date: input.expiryDate || null,
        issuing_country: input.issuingCountry,
        ...(input.storagePath ? { storage_path: input.storagePath } : {}),
        ...(input.storagePathFront ? { storage_path_front: input.storagePathFront } : {}),
        ...(input.storagePathBack ? { storage_path_back: input.storagePathBack } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,type" },
    )
    .select("*")
    .single();
  if (error) throw error;

  const row = data as DocumentRow;
  const frontPath = row.storage_path_front ?? row.storage_path;
  const [scanFrontUrl, scanBackUrl, scanUrl] = await Promise.all([
    signedUrl(supabase, frontPath),
    signedUrl(supabase, row.storage_path_back),
    signedUrl(supabase, row.storage_path),
  ]);
  return toUserDocument(row, { scanUrl: scanUrl ?? scanFrontUrl, scanFrontUrl, scanBackUrl });
}

export async function deleteUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("storage_path, storage_path_front, storage_path_back")
    .eq("user_id", userId)
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Document not found.");

  const paths = [data.storage_path, data.storage_path_front, data.storage_path_back].filter(
    (p): p is string => Boolean(p),
  );
  if (paths.length) {
    await supabase.storage.from("user-documents").remove(paths);
  }

  const { error: deleteError } = await supabase
    .from("user_documents")
    .delete()
    .eq("user_id", userId)
    .eq("id", documentId);
  if (deleteError) throw deleteError;
}

/**
 * If the account has no licence document yet, looks for one already sitting
 * on a booking record (guest-checkout scans carried onto user_bookings —
 * see lib/booking/stored-booking.ts) and copies its storage paths into a
 * real user_documents row, no re-upload needed since both live in the same
 * user-documents bucket. Returns the resulting document, or null if there
 * was nothing to backfill.
 */
export async function backfillLicenceFromBooking(
  supabase: SupabaseClient,
  userId: string,
  email?: string,
): Promise<UserDocument | null> {
  const existing = await findUserDocument(supabase, userId, "licence");
  const hasScans = Boolean(
    existing?.storage_path_front || existing?.storage_path_back || existing?.storage_path,
  );
  if (hasScans) return null;

  const scans = await findBookingDocumentScans({ userId, email });
  if (!scans.licenceFrontPath && !scans.licenceBackPath) return null;

  return upsertUserDocument(supabase, userId, {
    type: "licence",
    number: scans.licenceNumber ?? existing?.number ?? "",
    issueDate: scans.licenceIssue ?? existing?.issue_date ?? "",
    expiryDate: scans.licenceExpiry ?? existing?.expiry_date ?? "",
    issuingCountry: scans.licenceCountry ?? existing?.issuing_country ?? "LB",
    storagePathFront: scans.licenceFrontPath ?? null,
    storagePathBack: scans.licenceBackPath ?? null,
  });
}

/** Removes every stored scan + row for a user — used when deleting an account. */
export async function deleteAllUserDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("storage_path, storage_path_front, storage_path_back")
    .eq("user_id", userId);
  if (error) throw error;

  const paths = (data ?? [])
    .flatMap((row) => [row.storage_path, row.storage_path_front, row.storage_path_back])
    .filter((p): p is string => Boolean(p));
  if (paths.length) {
    await supabase.storage.from("user-documents").remove(paths);
  }

  const { error: deleteError } = await supabase.from("user_documents").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;
}
