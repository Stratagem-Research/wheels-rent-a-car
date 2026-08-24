import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/**
 * POST /api/booking/licence-scan — uploads a driver's licence scan during
 * guest checkout, before any account exists to own it. Deliberately
 * unauthenticated (guests have no session yet); scoped to a random path and
 * capped like the account-documents upload. Returns a 24h signed URL — long
 * enough to carry through to the confirmation page's "Create account" flow,
 * which downloads it and re-saves it as a real account document.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ message: "Invalid upload." }, { status: 400 });
  }
  const side = form.get("side");
  const file = form.get("file");
  if ((side !== "front" && side !== "back") || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Invalid upload." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ message: "File too large (max 5 MB)." }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: "Unsupported file type." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `guest-checkout/${randomUUID()}/${side}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("user-documents")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });
  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 500 });
  }

  const { data, error: signError } = await supabase.storage
    .from("user-documents")
    .createSignedUrl(path, 60 * 60 * 24);
  if (signError || !data?.signedUrl) {
    return NextResponse.json(
      { message: signError?.message ?? "Failed to sign upload URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: data.signedUrl, path });
}
