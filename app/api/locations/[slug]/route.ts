import { NextResponse } from "next/server";
import { getPublicBranches } from "@/lib/server/public-content";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const branches = await getPublicBranches();
    const branch = branches.find((b) => b.slug === slug);
    if (!branch) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(branch);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load location.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
