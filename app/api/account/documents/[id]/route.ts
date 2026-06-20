import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import { deleteUserDocument } from "@/lib/supabase/user-documents-repository";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    await deleteUserDocument(auth.supabase, auth.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete document.";
    return NextResponse.json({ message }, { status: 404 });
  }
}
