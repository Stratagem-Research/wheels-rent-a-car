import { NextResponse } from "next/server";
import type { SubmitBookingRequest } from "@/types/domain";
import { UnmappedWizardAddressError } from "@/lib/booking/wizard-address-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { handleBookingSubmit } from "@/lib/server/booking-service";
import { mapSubmitError } from "@/lib/server/submit-error";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBookingRequest;
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    const result = await handleBookingSubmit(body, { userId });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnmappedWizardAddressError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    const mapped = mapSubmitError(err);
    return NextResponse.json(
      {
        message: mapped.message,
        ...(mapped.reason ? { reason: mapped.reason } : {}),
      },
      { status: mapped.status },
    );
  }
}
