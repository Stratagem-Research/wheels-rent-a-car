import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  WheelsApiError,
  WheelsNetworkError,
  WheelsValidationError,
} from "@/lib/api/wheels-public";
import { syncWizardVehiclesFromApi } from "@/lib/server/wizard-vehicle-sync";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;

  const updatedSince = new URL(request.url).searchParams.get("updated_since")?.trim() || undefined;

  try {
    const result = await syncWizardVehiclesFromApi({ updatedSince });
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "wizard_vehicles",
      action: "sync",
      details: result,
    }).catch(() => undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/fleet/sync] failed", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message:
            "Wizard env invalid. Set WHEELS_INTERNAL_API_BASE_URL and WHEELS_INTERNAL_API_TOKEN in .env, then restart the dev server.",
          issues: error.issues.map((i) => i.path.join(".") || i.message),
        },
        { status: 500 },
      );
    }

    if (error instanceof WheelsValidationError) {
      const issues = Array.isArray(error.zodIssues)
        ? (error.zodIssues as Array<{ path?: unknown; message?: string }>).slice(0, 5).map((issue) => ({
            path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path ?? ""),
            message: issue.message,
          }))
        : undefined;
      return NextResponse.json(
        {
          message:
            "Wizard vehicles/sync response did not match the expected schema. Text the server log for Zod issues.",
          issues,
        },
        { status: 502 },
      );
    }

    if (error instanceof WheelsNetworkError) {
      return NextResponse.json(
        {
          message:
            "Could not reach Wizard vehicles/sync (network error). Confirm the demo/prod host is up and WHEELS_INTERNAL_API_BASE_URL is correct.",
        },
        { status: 502 },
      );
    }

    if (error instanceof WheelsApiError) {
      const bodyMessage =
        typeof error.body === "object" &&
        error.body &&
        "message" in error.body &&
        typeof (error.body as { message: unknown }).message === "string"
          ? (error.body as { message: string }).message
          : null;
      return NextResponse.json(
        {
          message:
            bodyMessage ||
            error.message ||
            (error.status === 401 || error.status === 403
              ? "Wizard rejected the internal API token (401/403). Check WHEELS_INTERNAL_API_TOKEN."
              : `Wizard vehicles/sync failed (HTTP ${error.status}).`),
          status: error.status,
        },
        { status: 502 },
      );
    }

    const message = error instanceof Error ? error.message : "Wizard vehicle sync failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
