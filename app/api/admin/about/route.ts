import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import {
  listAboutContent,
  replaceAboutContent,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import {
  ABOUT_PULL_QUOTE,
  ABOUT_STATS,
  ABOUT_STORY_PARAGRAPHS,
  ABOUT_TEAM_DEDICATION,
  ABOUT_TEAM_INTRO,
  ABOUT_TEAM,
  FLEET_PHILOSOPHY,
} from "@/lib/content/about";

const AboutContentSchema = z.object({
  storyParagraphs: z.array(z.string()),
  pullQuote: z.string(),
  fleetPhilosophy: z.object({
    heading: z.string(),
    paragraphs: z.array(z.string()),
  }),
  stats: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  teamIntro: z.string().default(""),
  teamDedication: z.string().default(""),
  team: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      photo: z.string(),
      quote: z.string().optional(),
      bio: z.string().default(""),
      highlights: z.array(z.string()).optional().default([]),
    }),
  ),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const content = await listAboutContent();
    return NextResponse.json({
      content:
        content ??
        ({
          storyParagraphs: ABOUT_STORY_PARAGRAPHS,
          pullQuote: ABOUT_PULL_QUOTE,
          fleetPhilosophy: FLEET_PHILOSOPHY,
          stats: ABOUT_STATS,
          teamIntro: ABOUT_TEAM_INTRO,
          teamDedication: ABOUT_TEAM_DEDICATION,
          team: ABOUT_TEAM,
        } as const),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load about content.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = AboutContentSchema.safeParse((body as { content?: unknown } | null)?.content);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid about content payload." }, { status: 400 });
  }
  try {
    await replaceAboutContent(parsed.data);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_about",
      action: "replace",
      details: {
        storyParagraphs: parsed.data.storyParagraphs.length,
        stats: parsed.data.stats.length,
        team: parsed.data.team.length,
      },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save about content.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
