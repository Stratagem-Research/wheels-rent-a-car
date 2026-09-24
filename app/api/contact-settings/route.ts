import { NextResponse } from "next/server";
import { getPublicContactSettings } from "@/lib/server/public-content";

/** Public read of the admin-managed phone + WhatsApp numbers. */
export async function GET() {
  const settings = await getPublicContactSettings();
  return NextResponse.json({ settings });
}
