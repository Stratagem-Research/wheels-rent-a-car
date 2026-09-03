import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import {
  deleteCmsMedia,
  listCmsMedia,
  storagePathFromPublicUrl,
  type CmsMediaKind,
} from "@/lib/supabase/cms-media-storage";

const KindSchema = z.enum(["vehicle", "team", "trip", "seo"]);

const BodySchema = z.object({
  kind: z.enum(["vehicle", "team", "trip", "seo"]),
  url: z.string().url().optional(),
  path: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const parsed = KindSchema.safeParse(url.searchParams.get("kind") ?? "");
  if (!parsed.success) {
    return NextResponse.json({ message: "kind must be vehicle, team, trip, or seo." }, { status: 400 });
  }

  try {
    const items = await listCmsMedia(parsed.data as CmsMediaKind);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list media.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const kind = parsed.data.kind as CmsMediaKind;
  const path =
    parsed.data.path ??
    (parsed.data.url ? storagePathFromPublicUrl(parsed.data.url, kind) : null);

  if (!path) {
    return NextResponse.json(
      { message: "Could not resolve storage path from url/path." },
      { status: 400 },
    );
  }

  try {
    await deleteCmsMedia({ kind, path });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
