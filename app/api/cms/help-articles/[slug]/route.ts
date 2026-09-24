import { NextResponse } from "next/server";
import {
  deleteHelpArticleFromDb,
  listHelpArticlesFromDb,
  upsertHelpArticleInDb,
} from "@/lib/supabase/cms-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { helpArticlePayloadSchema } from "@/lib/cms/schemas";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  try {
    const items = await listHelpArticlesFromDb();
    const item = items.find((article) => article.slug === slug);
    if (!item) {
      return NextResponse.json({ message: "Help article not found." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load help article.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const { slug } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const parsed = helpArticlePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Expected { item: HelpArticle } matching the schema." },
        { status: 400 },
      );
    }
    const article = parsed.data.item;
    if (article.slug !== slug) {
      return NextResponse.json(
        { message: "Body slug must match the URL slug." },
        { status: 400 },
      );
    }
    await upsertHelpArticleInDb(article);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_help_articles",
      action: "upsert",
      details: { slug: article.slug, sections: article.sections.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save help article.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const { slug } = await context.params;
  try {
    await deleteHelpArticleFromDb(slug);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_help_articles",
      action: "delete",
      details: { slug },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete help article.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
