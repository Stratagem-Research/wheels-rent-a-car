import { NextResponse } from "next/server";
import { getPublicSiteConfig } from "@/lib/server/public-content";

export async function GET() {
  try {
    const config = await getPublicSiteConfig();
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load site config.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
