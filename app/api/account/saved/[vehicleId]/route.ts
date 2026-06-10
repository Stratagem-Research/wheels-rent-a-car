import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import {
  addSavedVehicle,
  removeSavedVehicle,
} from "@/lib/supabase/saved-vehicles-repository";

type RouteContext = { params: Promise<{ vehicleId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  const { vehicleId } = await context.params;
  if (!vehicleId?.trim()) {
    return NextResponse.json({ message: "Vehicle id is required." }, { status: 400 });
  }

  try {
    await addSavedVehicle(auth.supabase, auth.user.id, vehicleId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Failed to save vehicle." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  const { vehicleId } = await context.params;
  if (!vehicleId?.trim()) {
    return NextResponse.json({ message: "Vehicle id is required." }, { status: 400 });
  }

  try {
    await removeSavedVehicle(auth.supabase, auth.user.id, vehicleId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Failed to remove saved vehicle." }, { status: 500 });
  }
}
