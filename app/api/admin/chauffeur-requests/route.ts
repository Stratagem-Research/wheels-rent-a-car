import { NextResponse } from "next/server";
import { listChauffeurLeads } from "@/lib/supabase/admin-repository";
import { requireAdminSession } from "@/lib/server/admin-api";

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const leads = await listChauffeurLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load chauffeur requests.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
