import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAccountUser } from "@/lib/server/account-auth";
import { getAdditionalDriver, upsertAdditionalDriver, resolveAdditionalDriverForAccount } from "@/lib/supabase/additional-drivers-repository";

async function uploadScan(
  supabase: SupabaseClient,
  userId: string,
  side: "front" | "back",
  file: File,
): Promise<{ path: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/additional-driver/${side}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("user-documents").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) return { error: error.message };
  return { path };
}

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;
  try {
    const driver = await resolveAdditionalDriverForAccount(
      auth.supabase,
      auth.user.id,
      auth.user.email ?? undefined,
    );
    return NextResponse.json({ driver });
  } catch {
    return NextResponse.json({ driver: null });
  }
}

export async function POST(request: Request) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const fileFront = form.get("fileFront");
    const fileBack = form.get("fileBack");

    let storagePathFront: string | null | undefined;
    let storagePathBack: string | null | undefined;

    if (fileFront instanceof File && fileFront.size > 0) {
      const uploaded = await uploadScan(auth.supabase, auth.user.id, "front", fileFront);
      if ("error" in uploaded) return NextResponse.json({ message: uploaded.error }, { status: 500 });
      storagePathFront = uploaded.path;
    }
    if (fileBack instanceof File && fileBack.size > 0) {
      const uploaded = await uploadScan(auth.supabase, auth.user.id, "back", fileBack);
      if ("error" in uploaded) return NextResponse.json({ message: uploaded.error }, { status: 500 });
      storagePathBack = uploaded.path;
    }

    await upsertAdditionalDriver(auth.supabase, auth.user.id, {
      firstName,
      lastName,
      storagePathFront,
      storagePathBack,
    });

    const driver = await getAdditionalDriver(auth.supabase, auth.user.id);
    return NextResponse.json({ driver });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save additional driver.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
