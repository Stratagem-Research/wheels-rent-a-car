import { NextResponse } from "next/server";
import { getBookingStatusByToken } from "@/lib/api/wheels-public";
import { realBookingApiEnabled } from "@/lib/api/wheels-public/live-handlers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 400 });
  }

  if (!realBookingApiEnabled()) {
    return NextResponse.json(
      { message: "Status polling requires real booking API." },
      { status: 503 },
    );
  }

  try {
    const response = await getBookingStatusByToken(token);
    return NextResponse.json(response.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status lookup failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
