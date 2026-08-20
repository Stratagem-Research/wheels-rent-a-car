import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toDomainUser } from "@/lib/auth/map-user";
import { requireAdminSession } from "@/lib/server/admin-api";

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * GET /api/admin/users?page=&perPage= — paginated list of customer accounts.
 *
 * Accounts live only in Supabase Auth (no separate `profiles` table this app
 * reads — see lib/auth/map-user.ts), so this paginates via
 * `auth.admin.listUsers()` directly rather than a `select ... limit/offset`
 * query. That API's own page/perPage/total — not the client-side
 * fetch-everything-then-slice pattern other admin list pages use — since a
 * growing user base would make "fetch every account up front" increasingly
 * wasteful and slow.
 */
export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(url.searchParams.get("perPage")) || DEFAULT_PER_PAGE),
  );

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    return NextResponse.json({
      items: data.users.map(toDomainUser),
      page,
      perPage,
      total: data.total,
      lastPage: data.lastPage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load accounts.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
