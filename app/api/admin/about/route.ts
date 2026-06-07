import { NextResponse } from "next/server";
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
import { aboutContentSchema } from "@/lib/cms/schemas";
import { toLocalizedString } from "@/lib/i18n/localized";

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const content = await listAboutContent();
    return NextResponse.json({
      content:
        content ??
        ({
          storyParagraphs: { en: ABOUT_STORY_PARAGRAPHS },
          pullQuote: toLocalizedString(ABOUT_PULL_QUOTE),
          fleetPhilosophy: {
            heading: toLocalizedString(FLEET_PHILOSOPHY.heading),
            paragraphs: { en: FLEET_PHILOSOPHY.paragraphs },
          },
          stats: ABOUT_STATS.map((item) => ({
            value: item.value,
            label: toLocalizedString(item.label),
          })),
          teamIntro: toLocalizedString(ABOUT_TEAM_INTRO),
          teamDedication: toLocalizedString(ABOUT_TEAM_DEDICATION),
          team: ABOUT_TEAM.map((member) => ({
            name: member.name,
            role: toLocalizedString(member.role),
            photo: member.photo,
            quote: member.quote ? toLocalizedString(member.quote) : undefined,
            bio: toLocalizedString(member.bio),
            highlights: { en: member.highlights ?? [] },
          })),
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
  const parsed = aboutContentSchema.safeParse((body as { content?: unknown } | null)?.content);
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
        storyParagraphs: parsed.data.storyParagraphs.en.length,
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
