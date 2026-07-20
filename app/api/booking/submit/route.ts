import { NextResponse } from "next/server";
import type { SubmitBookingRequest } from "@/types/domain";
import { WheelsThrottledError } from "@/lib/api/wheels-public";
import { UnmappedWizardAddressError } from "@/lib/booking/wizard-address-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  handleBookingSubmit,
  VehicleUnavailableError,
} from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBookingRequest;
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    const result = await handleBookingSubmit(body, { userId });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VehicleUnavailableError) {
      return NextResponse.json(
        { message: "Vehicle is not available for this period." },
        { status: 409 },
      );
    }
    if (err instanceof WheelsThrottledError) {
      return NextResponse.json(
        { message: "Too many booking requests. Please wait a moment and try again." },
        { status: 429 },
      );
    }
    if (err instanceof UnmappedWizardAddressError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes("3 months")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Incomplete booking") {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Vehicle gone") {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Booking submission failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
