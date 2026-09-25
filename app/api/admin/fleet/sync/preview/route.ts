import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  WheelsApiError,
  WheelsNetworkError,
  WheelsValidationError,
} from "@/lib/api/wheels-public";
import {
  syncWizardVehiclesFromApi,
  type WizardVehicleSyncPreview,
} from "@/lib/server/wizard-vehicle-sync";
import { requireAdminSession } from "@/lib/server/admin-api";

/**
 * Dry-run Wizard sync: fetches Wizard and returns the list of admin daily-rate
 * overrides that a real sync would reset to the Wizard price. Does not persist.
 */
export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;

  const updatedSince =
    new URL(request.url).searchParams.get("updated_since")?.trim() || undefined;

  try {
    const result = (await syncWizardVehiclesFromApi({
      updatedSince,
      dryRun: true,
    })) as WizardVehicleSyncPreview;
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/fleet/sync/preview] failed", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message:
            "Wizard env invalid. Set WHEELS_INTERNAL_API_BASE_URL and WHEELS_INTERNAL_API_TOKEN in .env, then restart the dev server.",
        },
        { status: 500 },
      );
    }
    if (error instanceof WheelsValidationError) {
      return NextResponse.json(
        { message: "Wizard vehicles/sync response did not match the expected schema." },
        { status: 502 },
      );
    }
    if (error instanceof WheelsNetworkError) {
      return NextResponse.json(
        { message: "Could not reach Wizard vehicles/sync (network error)." },
        { status: 502 },
      );
    }
    if (error instanceof WheelsApiError) {
      return NextResponse.json(
        { message: `Wizard vehicles/sync failed (HTTP ${error.status}).` },
        { status: 502 },
      );
    }
    const message = error instanceof Error ? error.message : "Wizard vehicle sync preview failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
