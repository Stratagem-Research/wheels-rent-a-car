import { NextResponse } from "next/server";
import { getPublicBranches } from "@/lib/server/public-content";

export async function GET() {
  try {
    const items = await getPublicBranches();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load locations.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
