import { NextResponse } from "next/server";
import { getBookingStatusByToken } from "@/lib/api/wheels-public";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 400 });
  }

  try {
    const response = await getBookingStatusByToken(token);
    return NextResponse.json(response.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status lookup failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
