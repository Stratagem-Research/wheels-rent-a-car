import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "wheels-rent-a-car-web",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
