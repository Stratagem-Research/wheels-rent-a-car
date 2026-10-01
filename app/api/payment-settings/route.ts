import { NextResponse } from "next/server";
import { getPublicPaymentSettings } from "@/lib/server/public-content";

export async function GET() {
  const settings = await getPublicPaymentSettings();
  return NextResponse.json({ settings });
}
