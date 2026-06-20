import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAccountUser } from "@/lib/server/account-auth";
import { listUserDocuments, upsertUserDocument } from "@/lib/supabase/user-documents-repository";
import type { DocumentType } from "@/types/domain";

const DocumentTypeSchema = z.enum(["licence", "id", "passport"]);

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const items = await listUserDocuments(auth.supabase, auth.user.id);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "Failed to load documents." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const typeRaw = form.get("type");
    const parsedType = DocumentTypeSchema.safeParse(typeRaw);
    if (!parsedType.success) {
      return NextResponse.json({ message: "Invalid document type." }, { status: 400 });
    }

    const number = String(form.get("number") ?? "").trim();
    const issueDate = String(form.get("issueDate") ?? "").trim();
    const expiryDate = String(form.get("expiryDate") ?? "").trim();
    const issuingCountry = String(form.get("issuingCountry") ?? "LB").trim();
    const file = form.get("file");

    let storagePath: string | null = null;
    if (file instanceof File && file.size > 0) {
      const ext = file.name.split(".").pop() ?? "bin";
      storagePath = `${auth.user.id}/${parsedType.data}/${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await auth.supabase.storage
        .from("user-documents")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });
      if (uploadError) {
        return NextResponse.json({ message: uploadError.message }, { status: 500 });
      }
    }

    const saved = await upsertUserDocument(auth.supabase, auth.user.id, {
      type: parsedType.data as DocumentType,
      number,
      issueDate,
      expiryDate,
      issuingCountry,
      storagePath,
    });

    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save document.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
