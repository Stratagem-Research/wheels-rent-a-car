import { NextResponse } from "next/server";
import { syncWizardVehiclesFromApi } from "@/lib/server/wizard-vehicle-sync";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;

  try {
    const result = await syncWizardVehiclesFromApi();
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "wizard_vehicles",
      action: "sync",
      details: result,
    }).catch(() => undefined);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wizard vehicle sync failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
