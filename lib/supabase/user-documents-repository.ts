import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentStatus, DocumentType, UserDocument } from "@/types/domain";

type DocumentRow = {
  id: string;
  user_id: string;
  type: DocumentType;
  number: string;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_country: string;
  storage_path: string | null;
  status: DocumentStatus;
  uploaded_at: string;
};

function toUserDocument(row: DocumentRow, scanUrl?: string): UserDocument {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    number: row.number,
    issueDate: row.issue_date ?? "",
    expiryDate: row.expiry_date ?? "",
    issuingCountry: row.issuing_country,
    scanUrl,
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
    let scanUrl: string | undefined;
    if (row.storage_path) {
      const { data: signed } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(row.storage_path, 3600);
      scanUrl = signed?.signedUrl;
    }
    docs.push(toUserDocument(row, scanUrl));
  }

  return docs;
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,type" },
    )
    .select("*")
    .single();
  if (error) throw error;

  const row = data as DocumentRow;
  let scanUrl: string | undefined;
  if (row.storage_path) {
    const { data: signed } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(row.storage_path, 3600);
    scanUrl = signed?.signedUrl;
  }
  return toUserDocument(row, scanUrl);
}

export async function deleteUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Document not found.");

  if (data.storage_path) {
    await supabase.storage.from("user-documents").remove([data.storage_path as string]);
  }

  const { error: deleteError } = await supabase
    .from("user_documents")
    .delete()
    .eq("user_id", userId)
    .eq("id", documentId);
  if (deleteError) throw deleteError;
}
