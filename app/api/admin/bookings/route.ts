import { NextResponse } from "next/server";
import { listAdminWebsiteBookings } from "@/lib/supabase/admin-bookings-repository";
import { requireAdminSession } from "@/lib/server/admin-api";

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listAdminWebsiteBookings();
    const counters = {
      total: items.length,
      account: items.filter((item) => item.customerType === "account").length,
      guest: items.filter((item) => item.customerType === "guest").length,
      holding: items.filter((item) => item.reducingCount).length,
    };
    return NextResponse.json({ items, counters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bookings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
