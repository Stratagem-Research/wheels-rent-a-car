import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAccountUser } from "@/lib/server/account-auth";
import { findUserDocument, listUserDocuments, upsertUserDocument, backfillLicenceFromBooking } from "@/lib/supabase/user-documents-repository";
import { findBookingDocumentScans, signedStorageUrl } from "@/lib/supabase/booking-document-scans";
import type { DocumentType } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

const DocumentTypeSchema = z.enum(["licence", "id", "passport"]);

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    await backfillLicenceFromBooking(auth.supabase, auth.user.id, auth.user.email ?? undefined).catch(
      () => null,
    );
    const items = await listUserDocuments(auth.supabase, auth.user.id);
    const licence = items.find((item) => item.type === "licence");
    const hasLicenceScans = Boolean(licence?.scanFrontUrl || licence?.scanBackUrl || licence?.scanUrl);
    if (!hasLicenceScans) {
      const scans = await findBookingDocumentScans({
        userId: auth.user.id,
        email: auth.user.email,
      });
      const [scanFrontUrl, scanBackUrl] = await Promise.all([
        signedStorageUrl(scans.licenceFrontPath),
        signedStorageUrl(scans.licenceBackPath),
      ]);
      if (scanFrontUrl || scanBackUrl) {
        const overlay = {
          id: licence?.id ?? "booking-licence",
          userId: auth.user.id,
          type: "licence" as const,
          number: scans.licenceNumber ?? licence?.number ?? "",
          issueDate: scans.licenceIssue ?? licence?.issueDate ?? "",
          expiryDate: scans.licenceExpiry ?? licence?.expiryDate ?? "",
          issuingCountry: scans.licenceCountry ?? licence?.issuingCountry ?? "LB",
          scanUrl: scanFrontUrl,
          scanFrontUrl,
          scanBackUrl,
          status: licence?.status ?? "pending",
          uploadedAt: licence?.uploadedAt ?? new Date().toISOString(),
        };
        return NextResponse.json({
          items: [...items.filter((item) => item.type !== "licence"), overlay],
        });
      }
    }
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "Failed to load documents." }, { status: 500 });
  }
}

async function uploadScan(
  supabase: SupabaseClient,
  userId: string,
  type: DocumentType,
  side: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${type}/${side}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("user-documents").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) return { error: error.message };
  return { path };
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

    const existing = await findUserDocument(auth.supabase, auth.user.id, parsedType.data);
    const number = String(form.get("number") ?? "").trim() || existing?.number || "";
    const issueDate = String(form.get("issueDate") ?? "").trim() || existing?.issue_date || "";
    const expiryDate = String(form.get("expiryDate") ?? "").trim() || existing?.expiry_date || "";
    const issuingCountry =
      String(form.get("issuingCountry") ?? "").trim() || existing?.issuing_country || "LB";
    const file = form.get("file");
    const fileFront = form.get("fileFront");
    const fileBack = form.get("fileBack");

    let storagePath: string | null = null;
    let storagePathFront: string | null = null;
    let storagePathBack: string | null = null;

    if (parsedType.data === "licence" || parsedType.data === "id") {
      if (fileFront instanceof File && fileFront.size > 0) {
        const uploaded = await uploadScan(auth.supabase, auth.user.id, parsedType.data, "front", fileFront);
        if ("error" in uploaded) {
          return NextResponse.json({ message: uploaded.error }, { status: 500 });
        }
        storagePathFront = uploaded.path;
        storagePath = uploaded.path;
      }
      if (fileBack instanceof File && fileBack.size > 0) {
        const uploaded = await uploadScan(auth.supabase, auth.user.id, parsedType.data, "back", fileBack);
        if ("error" in uploaded) {
          return NextResponse.json({ message: uploaded.error }, { status: 500 });
        }
        storagePathBack = uploaded.path;
      }
    } else if (file instanceof File && file.size > 0) {
      const uploaded = await uploadScan(
        auth.supabase,
        auth.user.id,
        parsedType.data,
        "scan",
        file,
      );
      if ("error" in uploaded) {
        return NextResponse.json({ message: uploaded.error }, { status: 500 });
      }
      storagePath = uploaded.path;
    }

    const saved = await upsertUserDocument(auth.supabase, auth.user.id, {
      type: parsedType.data as DocumentType,
      number,
      issueDate,
      expiryDate,
      issuingCountry,
      storagePath,
      storagePathFront,
      storagePathBack,
    });

    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save document.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
