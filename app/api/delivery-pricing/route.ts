import { NextResponse } from "next/server";
import { getPublicDeliveryPricing } from "@/lib/server/public-content";

export async function GET() {
  const settings = await getPublicDeliveryPricing();
  return NextResponse.json({ settings });
}
