import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listChauffeurLeads,
  listCorporateLeads,
  listLongTermLeads,
  updateLeadStatus,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const LeadStatusSchema = z.enum(["new", "in-progress", "won", "lost"]);
const LeadKindSchema = z.enum(["long-term", "corporate", "chauffeur"]);

const LeadUpdateSchema = z.object({
  id: z.string().uuid(),
  kind: LeadKindSchema,
  status: LeadStatusSchema,
  owner: z.string().optional(),
  adminNotes: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [longTerm, corporate, chauffeur] = await Promise.all([
      listLongTermLeads(),
      listCorporateLeads(),
      listChauffeurLeads(),
    ]);
    const all = [...longTerm, ...corporate, ...chauffeur];
    const counters = {
      total: all.length,
      new: all.filter((item) => item.status === "new").length,
      inProgress: all.filter((item) => item.status === "in-progress").length,
      won: all.filter((item) => item.status === "won").length,
      lost: all.filter((item) => item.status === "lost").length,
    };
    return NextResponse.json({
      counters,
      longTerm,
      corporate,
      chauffeur,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leads.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = LeadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid lead update payload." }, { status: 400 });
  }
  try {
    const table =
      parsed.data.kind === "long-term"
        ? "long_term_enquiries"
        : parsed.data.kind === "corporate"
          ? "corporate_enquiries"
          : "chauffeur_enquiries";
    await updateLeadStatus(
      table,
      parsed.data.id,
      parsed.data.status,
      parsed.data.owner?.trim() || null,
      parsed.data.adminNotes?.trim() || null,
    );
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: `lead:${parsed.data.kind}`,
      action: "status_update",
      details: {
        id: parsed.data.id,
        status: parsed.data.status,
        owner: parsed.data.owner ?? null,
      },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead status.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
