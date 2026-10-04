import { NextResponse } from "next/server";
import type { AdminRole, AdminSession } from "@/lib/server/admin-auth";
import { assertAdminCsrf, readAdminSession, resolveAdminRole } from "@/lib/server/admin-auth";
import { isAdminSessionActive } from "@/lib/supabase/admin-sessions-repository";

/**
 * A valid signature isn't enough: the session must also still be live on the
 * server (not logged out, not expired) and the user must still hold a role. The
 * role used is the *current* one, not whatever was baked into the token.
 */
export async function requireAdminSession(
  request: Request,
  allowedRoles?: AdminRole[],
): Promise<{ ok: true; session: AdminSession } | { ok: false; response: NextResponse }> {
  const unauthorized = {
    ok: false as const,
    response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
  };
  const signed = readAdminSession(request);
  if (!signed) return unauthorized;

  let active: boolean;
  try {
    active = await isAdminSessionActive(signed.sid);
  } catch {
    // Can't confirm the session is alive — fail closed rather than trust the cookie.
    return {
      ok: false,
      response: NextResponse.json({ message: "Session check unavailable." }, { status: 503 }),
    };
  }
  if (!active) return unauthorized;

  const role = resolveAdminRole(signed.username);
  if (!role) return unauthorized;
  const session: AdminSession = { ...signed, role };

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

export function requireAdminCsrf(request: Request): NextResponse | null {
  if (!assertAdminCsrf(request)) {
    return NextResponse.json({ message: "CSRF check failed." }, { status: 403 });
  }
  return null;
}
