import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import {
  assertCmsMediaFile,
  uploadCmsMedia,
  type CmsMediaKind,
} from "@/lib/supabase/cms-media-storage";

const KindSchema = z.enum(["vehicle", "team", "trip", "seo"]);

function mimeFromFileName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return null;
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Expected multipart form data." }, { status: 400 });
  }

  const kindParsed = KindSchema.safeParse(String(form.get("kind") ?? ""));
  if (!kindParsed.success) {
    return NextResponse.json({ message: "kind must be vehicle, team, trip, or seo." }, { status: 400 });
  }
  const kind = kindParsed.data as CmsMediaKind;
  const entityId = String(form.get("entityId") ?? "item").trim() || "item";
  const file = form.get("file");

  // Undici/FormData may yield Blob rather than File after Request round-trip.
  if (!(file instanceof Blob) || file.size <= 0) {
    return NextResponse.json({ message: "file is required." }, { status: 400 });
  }

  const fileName = file instanceof File && file.name ? file.name : "upload.jpg";
  const contentType = file.type || mimeFromFileName(fileName) || "application/octet-stream";
  const check = assertCmsMediaFile({ size: file.size, type: contentType });
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadCmsMedia({
      kind,
      entityId,
      fileName,
      contentType,
      buffer,
    });
    return NextResponse.json({
      url: uploaded.url,
      path: uploaded.path,
      bucket: uploaded.bucket,
      alt: fileName.replace(/\.[^.]+$/, ""),
      width: 1600,
      height: 900,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
